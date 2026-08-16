import { getContract } from "thirdweb";
import { type Account, privateKeyToAccount } from "thirdweb/wallets";
import { LOG_A_DOG } from "~/constants/addresses";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { env } from "~/env";
import { client } from "~/server/utils";
import { redis } from "~/server/utils/redis";
import {
  hasRole,
  OPERATOR_ROLE,
} from "~/thirdweb/8453/0x6cfb88c8d0d7ffc563155e13c62b4fa17bc25974";

/**
 * Server-side gas sponsorship for logging a dog.
 *
 * thirdweb's hosted Engine server wallet used to relay every write; its vault
 * access token was invalidated by an issuer rotation, so writes moved into the
 * user's own wallet. That only covers wallets that can sponsor themselves —
 * in-app (EIP-7702) and EIP-5792 smart wallets — while a plain EOA (MetaMask,
 * Rainbow, most WalletConnect wallets) would have to hold Base ETH.
 *
 * Rather than leave the guarantee dependent on which wallet someone happens to
 * connect, EVERY log is relayed through a dedicated sponsor EOA calling
 * `logHotdogOnBehalf`, exactly as Engine used to: one code path, one funding
 * source, gasless for everyone. The sponsor pays the gas; the log is still
 * attributed to the authenticated user because `eater` is taken from their
 * session, never from the request body. The client falls back to the wallet's
 * own rail if this is unavailable.
 */

/** Reverts unless the caller holds OPERATOR_ROLE, so guard before sending. */
const OPERATOR_ROLE_CACHE_SECONDS = 300;

/** One sponsored log per address per cooldown window. */
const SPONSOR_COOLDOWN_SECONDS = 30;

/**
 * Per-address and global ceilings on how much gas a day we're willing to eat.
 * The global one now covers ALL logging traffic rather than just plain EOAs, so
 * it is the real daily spend cap: a log costs roughly 0.00001 ETH on Base, so
 * 2000 of them is around 0.02 ETH. Hitting either limit is not fatal — the
 * client falls back to the wallet's own rail.
 */
const SPONSOR_DAILY_LIMIT_PER_USER = 25;
const SPONSOR_DAILY_LIMIT_GLOBAL = 2000;

/** How long a single relayed send may hold the nonce lock. */
const SPONSOR_LOCK_SECONDS = 60;

export class SponsorUnavailableError extends Error {}
export class SponsorRateLimitError extends Error {}

let cachedAccount: Account | null | undefined;

/** Why sponsorship isn't working, for diagnosis — never shown verbatim to users. */
export type SponsorUnavailableReason =
  | "not-signed-in"
  | "not-configured"
  | "invalid-key"
  | "missing-operator-role"
  | "check-failed";

/**
 * The EOA that pays for relayed logs, or null when sponsorship is not
 * configured (in which case callers should let the user pay their own gas).
 */
export function getSponsorAccount(): Account | null {
  if (cachedAccount !== undefined) return cachedAccount;

  const configured = env.LOGADOG_SPONSOR_PK ?? env.LOGADOG_KEEPER_PK;
  if (!configured) {
    cachedAccount = null;
    return null;
  }

  // This repo stores keys both ways — LOGADOG_KEEPER_PK carries its own `0x`,
  // while ADMIN_PRIVATE_KEY is bare and callers prepend it. Accept either, or a
  // sponsor key pasted in the bare style silently reads as "not configured".
  const privateKey: `0x${string}` = `0x${configured.replace(/^0x/, "")}`;

  try {
    cachedAccount = privateKeyToAccount({
      client,
      privateKey,
    }) as unknown as Account;
  } catch (error) {
    console.error(
      "[gasless] LOGADOG_SPONSOR_PK is not a usable private key — sponsored logging is off:",
      error,
    );
    cachedAccount = null;
  }

  return cachedAccount;
}

/**
 * Full sponsorship health, so a failure says *why* instead of just going quiet.
 * Getting this wrong is invisible from the outside — the app keeps working and
 * simply bills users for gas — so the reason is worth carrying around.
 */
export async function getSponsorStatus(
  chainId: number,
  /**
   * Whether the *caller* can use the relay at all. `logGasless` is a
   * protectedProcedure that takes `eater` from the session, so a signed-out
   * visitor gets no sponsorship however healthy the sponsor is — and logging
   * needed no session before the relay existed, so this is easy to miss.
   */
  isSignedIn: boolean,
): Promise<{
  available: boolean;
  sponsor: string | null;
  reason?: SponsorUnavailableReason;
}> {
  if (!isSignedIn) {
    return { available: false, sponsor: null, reason: "not-signed-in" };
  }

  const configured = env.LOGADOG_SPONSOR_PK ?? env.LOGADOG_KEEPER_PK;
  const sponsor = getSponsorAccount();

  if (!sponsor) {
    return {
      available: false,
      sponsor: null,
      reason: configured ? "invalid-key" : "not-configured",
    };
  }

  try {
    const hasOperatorRole = await sponsorHasOperatorRole(
      chainId,
      sponsor.address,
    );
    if (!hasOperatorRole) {
      console.warn(
        `[gasless] sponsor ${sponsor.address} does not hold OPERATOR_ROLE on LogADog — every log will fall back to the user's wallet. Grant it with addOperator(${sponsor.address}).`,
      );
      return {
        available: false,
        sponsor: sponsor.address,
        reason: "missing-operator-role",
      };
    }
    return { available: true, sponsor: sponsor.address };
  } catch (error) {
    console.error("[gasless] could not check sponsor OPERATOR_ROLE:", error);
    return {
      available: false,
      sponsor: sponsor.address,
      reason: "check-failed",
    };
  }
}

function logADogContract(chainId: number) {
  const address = LOG_A_DOG[chainId];
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  if (!address || !chain) {
    throw new SponsorUnavailableError(`Unsupported chain ${chainId}`);
  }
  return getContract({ address, chain, client });
}

/**
 * `logHotdogOnBehalf` is `operatorOnly`, so a sponsor without the role would
 * burn gas on a guaranteed revert. Check first and cache the answer — the role
 * only changes when an admin calls `addOperator`/`removeOperator`.
 */
export async function sponsorHasOperatorRole(
  chainId: number,
  sponsorAddress: string,
): Promise<boolean> {
  const cacheKey = `sponsor:operator:${chainId}:${sponsorAddress.toLowerCase()}`;
  const cached = await redis.get<boolean>(cacheKey).catch(() => null);
  if (typeof cached === "boolean") return cached;

  const contract = logADogContract(chainId);
  const role = await OPERATOR_ROLE({ contract });
  const granted = await hasRole({
    contract,
    role,
    account: sponsorAddress as `0x${string}`,
  });

  // Only cache the happy answer for long: a freshly granted role should take
  // effect on the next attempt rather than after a five minute wait.
  await redis
    .set(cacheKey, granted, {
      ex: granted ? OPERATOR_ROLE_CACHE_SECONDS : 30,
    })
    .catch(() => undefined);

  return granted;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Rate limit sponsored logs so a single account (or a bad day) can't drain the
 * sponsor wallet. Consumes quota, so only call it once we intend to send.
 */
export async function assertSponsorQuota(address: string): Promise<void> {
  const user = address.toLowerCase();

  const cooldownKey = `sponsor:cooldown:${user}`;
  const acquired = await redis.set(cooldownKey, Date.now(), {
    nx: true,
    ex: SPONSOR_COOLDOWN_SECONDS,
  });
  if (!acquired) {
    const ttl = await redis.ttl(cooldownKey);
    throw new SponsorRateLimitError(
      `Please wait ${ttl > 0 ? ttl : SPONSOR_COOLDOWN_SECONDS}s before logging another dog.`,
    );
  }

  const userDailyKey = `sponsor:daily:${user}:${today()}`;
  const userCount = await redis.incr(userDailyKey);
  if (userCount === 1) await redis.expire(userDailyKey, 86_400);
  if (userCount > SPONSOR_DAILY_LIMIT_PER_USER) {
    throw new SponsorRateLimitError(
      "You've hit today's limit for sponsored logs. You can still log by paying your own gas.",
    );
  }

  const globalDailyKey = `sponsor:daily:global:${today()}`;
  const globalCount = await redis.incr(globalDailyKey);
  if (globalCount === 1) await redis.expire(globalDailyKey, 86_400);
  if (globalCount > SPONSOR_DAILY_LIMIT_GLOBAL) {
    throw new SponsorRateLimitError(
      "Sponsored logging is at capacity for today. You can still log by paying your own gas.",
    );
  }
}

/**
 * Serialise sponsor sends. thirdweb reads the pending nonce right before
 * signing, so two concurrent relays would sign the same nonce and one would be
 * dropped. A short Redis lock keeps estimate-and-send atomic across instances.
 */
export async function withSponsorNonceLock<T>(
  chainId: number,
  fn: () => Promise<T>,
): Promise<T> {
  const lockKey = `sponsor:lock:${chainId}`;
  const deadline = Date.now() + 20_000;

  for (;;) {
    const acquired = await redis.set(lockKey, Date.now(), {
      nx: true,
      ex: SPONSOR_LOCK_SECONDS,
    });
    if (acquired) break;
    if (Date.now() > deadline) {
      throw new SponsorRateLimitError(
        "Sponsored logging is busy right now — please try again in a moment.",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  try {
    return await fn();
  } finally {
    await redis.del(lockKey).catch(() => undefined);
  }
}

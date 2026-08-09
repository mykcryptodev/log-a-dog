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
 * Server-side gas sponsorship for wallets that cannot sponsor themselves.
 *
 * thirdweb's hosted Engine server wallet used to relay every write; its vault
 * access token was invalidated by an issuer rotation, so writes now come from
 * the user's own wallet. That works for in-app (EIP-7702) and EIP-5792 smart
 * wallets, which get sponsored by the thirdweb bundler — but a plain EOA
 * (MetaMask, Rainbow, most WalletConnect wallets) has no sponsorship rail and
 * would have to hold Base ETH.
 *
 * For those wallets we relay `logHotdogOnBehalf` from a dedicated sponsor EOA,
 * exactly as Engine used to. The sponsor pays the gas; the log is still
 * attributed to the authenticated user because `eater` is taken from their
 * session, never from the request body.
 */

/** Reverts unless the caller holds OPERATOR_ROLE, so guard before sending. */
const OPERATOR_ROLE_CACHE_SECONDS = 300;

/** One sponsored log per address per cooldown window. */
const SPONSOR_COOLDOWN_SECONDS = 30;

/** Per-address and global ceilings on how much gas a day we're willing to eat. */
const SPONSOR_DAILY_LIMIT_PER_USER = 25;
const SPONSOR_DAILY_LIMIT_GLOBAL = 750;

/** How long a single relayed send may hold the nonce lock. */
const SPONSOR_LOCK_SECONDS = 60;

export class SponsorUnavailableError extends Error {}
export class SponsorRateLimitError extends Error {}

let cachedAccount: Account | null | undefined;

/**
 * The EOA that pays for relayed logs, or null when sponsorship is not
 * configured (in which case callers should let the user pay their own gas).
 */
export function getSponsorAccount(): Account | null {
  if (cachedAccount !== undefined) return cachedAccount;

  const privateKey = env.LOGADOG_SPONSOR_PK ?? env.LOGADOG_KEEPER_PK;
  if (!privateKey) {
    cachedAccount = null;
    return null;
  }

  try {
    cachedAccount = privateKeyToAccount({
      client,
      privateKey,
    }) as unknown as Account;
  } catch (error) {
    console.error("Invalid gasless sponsor private key:", error);
    cachedAccount = null;
  }

  return cachedAccount;
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

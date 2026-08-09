import {
  sendTransaction,
  waitForReceipt,
  type Chain,
  type PreparedTransaction,
} from "thirdweb";
import type { Wallet } from "thirdweb/wallets";
import {
  getCapabilities,
  sendAndConfirmCalls,
  type PreparedSendCall,
} from "thirdweb/wallets/eip5792";
import { DATA_SUFFIX, withBuilderCode } from "~/constants/builderCode";
import { client } from "~/providers/Thirdweb";

/**
 * Which sponsorship rail a wallet can use for a given chain.
 *
 * - `wallet` — the account sponsors itself. thirdweb in-app wallets are
 *   EIP-7702-delegated with `sponsorGas: true` (see Connect.tsx), so an ordinary
 *   `sendTransaction` already goes through the thirdweb bundler for free. Same
 *   for 4337 smart accounts.
 * - `paymaster` — an EXTERNAL wallet that speaks EIP-5792 and accepts a
 *   `paymasterService` capability (Coinbase Smart Wallet, Base App, …). We hand
 *   it the thirdweb paymaster URL and it sponsors the userOp.
 * - `none` — a plain EOA (MetaMask, Rainbow, most WalletConnect wallets). It
 *   cannot be sponsored client-side at all; the caller must either relay the
 *   call through a server-side operator or let the user pay their own gas.
 */
export type SponsorshipRail = "wallet" | "paymaster" | "none";

/** How a transaction actually got sent, for logging/telemetry. */
export type GaslessRoute = "wallet" | "paymaster" | "user-paid";

export type SendResult = {
  transactionHash: string;
  route: GaslessRoute;
};

/** thirdweb's bundler doubles as the ERC-7677 paymaster service endpoint. */
export function paymasterUrl(chainId: number): string {
  return `https://${chainId}.bundler.thirdweb.com/${client.clientId}`;
}

/**
 * thirdweb-managed accounts (in-app wallets and smart wallets) route through
 * thirdweb's own bundler, so sponsorship is baked into the account rather than
 * exposed as something we hand a paymaster URL to. Passing one anyway is at
 * best redundant and at worst breaks their internal `sendCalls`.
 */
function sponsorsInternally(wallet: Wallet): boolean {
  return (
    wallet.id === "inApp" || wallet.id === "embedded" || wallet.id === "smart"
  );
}

type ChainCapabilities = {
  paymasterService?: { supported?: boolean };
  atomic?: { status?: string };
};

/**
 * Work out how (or whether) this wallet can send `chainId` transactions without
 * charging the user gas.
 *
 * NOTE: thirdweb's `getCapabilities` normalises the EIP-5792 response keys with
 * `Number(chainId)`, so the record is keyed by the DECIMAL chain id (8453) — not
 * the `0x2105` hex string the RPC returns. Looking it up by hex (as this code
 * used to) silently missed every time, which is why nothing was ever sponsored.
 */
export async function getSponsorshipRail({
  wallet,
  chainId,
}: {
  wallet: Wallet;
  chainId: number;
}): Promise<SponsorshipRail> {
  if (!wallet.getAccount()) return "none";

  // Always pass `chainId`: thirdweb's own accounts answer for chain 1 when it
  // is omitted, so the lookup below would miss on Base.
  // Throws outright for wallets with no EIP-5792 support at all.
  const capabilities = await getCapabilities({ wallet, chainId }).catch(
    () => null,
  );
  const chainCapabilities = capabilities?.[chainId] as
    | ChainCapabilities
    | undefined;

  if (!chainCapabilities?.paymasterService?.supported) return "none";
  return sponsorsInternally(wallet) ? "wallet" : "paymaster";
}

/**
 * Send a prepared transaction from the user's wallet, paying for it out of the
 * app's pocket whenever the wallet supports it.
 *
 * Returns `null` — without sending anything — when the wallet cannot be
 * sponsored and `allowUserPaid` is false. That lets the caller try a
 * server-sponsored relay first and only fall back to charging the user.
 */
export async function sendSponsoredTransaction({
  wallet,
  chain,
  transaction,
  allowUserPaid = true,
  forceUserPaid = false,
}: {
  wallet: Wallet;
  chain: Chain;
  transaction: PreparedTransaction;
  /** Fall back to a user-paid send when no sponsorship rail is available. */
  allowUserPaid?: boolean;
  /** Skip sponsorship entirely (the "Pay my own gas fees" opt-in). */
  forceUserPaid?: boolean;
}): Promise<SendResult | null> {
  const account = wallet.getAccount();
  if (!account) throw new Error("No wallet connected");

  const rail = forceUserPaid
    ? "none"
    : await getSponsorshipRail({ wallet, chainId: chain.id });

  if (rail === "paymaster") {
    const result = await sendAndConfirmCalls({
      chain,
      wallet,
      // `sendAndConfirmCalls` only exposes its wallet-id generic, so its call
      // type is pinned to the default empty ABI. Prepared contract calls are
      // structurally the same thing with a narrower method type.
      calls: [transaction as PreparedSendCall],
      capabilities: {
        paymasterService: { url: paymasterUrl(chain.id) },
        // Builder Code attribution rides on the outer userOp for EIP-5792.
        // Optional so wallets that don't know the capability ignore it rather
        // than rejecting the whole bundle.
        dataSuffix: { value: DATA_SUFFIX, optional: true },
      },
    });
    const transactionHash = result.receipts?.[0]?.transactionHash;
    // A confirmed bundle with no receipt hash is not something we can index or
    // share, and silently retrying would log the dog (and mint its coin) twice.
    if (!transactionHash) {
      throw new Error("Sponsored transaction confirmed without a receipt");
    }
    return { transactionHash, route: "paymaster" };
  }

  if (rail === "none" && !allowUserPaid) return null;

  const result = await sendTransaction({
    account,
    transaction: await withBuilderCode(transaction),
  });
  // `waitForReceipt` resolves for reverted transactions too, so check the
  // status ourselves rather than reporting a failed log as a success.
  const receipt = await waitForReceipt({
    client,
    chain,
    transactionHash: result.transactionHash,
  });
  if (receipt.status !== "success") {
    throw new Error(`Transaction reverted (${result.transactionHash})`);
  }

  return {
    transactionHash: result.transactionHash,
    // `wallet` here means the in-app/smart account paid via its own bundler.
    route: rail === "wallet" ? "wallet" : "user-paid",
  };
}

import type { PreparedTransaction } from "thirdweb";
import type { Wallet } from "thirdweb/wallets";
import { sendTransaction } from "thirdweb";
import { sendCalls, getCapabilities } from "thirdweb/wallets/eip5792";
import { getThirdwebClient } from "~/utils/thirdweb";
import { getActiveChain } from "~/constants/chains";

/**
 * Send an on-chain transaction, preferring gasless EIP-5792 sendCalls when the
 * wallet supports it (mirrors web VoteBar / Revoke pattern).
 */
export async function sendOnChainTx(
  wallet: Wallet,
  transaction: PreparedTransaction,
): Promise<void> {
  const account = wallet.getAccount();
  if (!account) throw new Error("No wallet account");

  const chain = getActiveChain();
  const client = getThirdwebClient();
  const chainIdAsHex = chain.id.toString(16) as unknown as number;

  const walletCapabilities = await getCapabilities({ wallet }).catch(() => null);
  if (walletCapabilities?.[chainIdAsHex]) {
    await sendCalls({
      chain,
      wallet,
      calls: [transaction],
      capabilities: {
        paymasterService: {
          url: `https://${chain.id}.bundler.thirdweb.com/${client.clientId}`,
        },
      },
    });
    return;
  }

  await sendTransaction({ account, transaction });
}

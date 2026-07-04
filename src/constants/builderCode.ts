import type { Abi, AbiFunction } from "abitype";
import { Attribution } from "ox/erc8021";
import { encode, prepareTransaction, type PreparedTransaction } from "thirdweb";
import { resolvePromisedValue } from "thirdweb/utils";

/**
 * Base Builder Code for Log a Dog, registered on base.dev.
 *
 * NOTE: this is DISTINCT from the `base:app_id` (6a49…) in the site's <meta>
 * tag (see `src/pages/_document.tsx`). The meta tag verifies app ownership; this
 * code is appended to on-chain transaction calldata (ERC-8021) so Base can
 * attribute activity to us and pay referral fees.
 */
export const BUILDER_CODE = "bc_ieek2lwn";

/**
 * ERC-8021 attribution suffix derived from {@link BUILDER_CODE}. Appended to the
 * end of a transaction's calldata; target contracts ignore the trailing bytes
 * (standard ABI decoding stops before them), so no contract changes are needed.
 */
export const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

/**
 * Return a copy of a thirdweb prepared transaction with the Builder Code suffix
 * appended to its calldata. thirdweb has no built-in `dataSuffix`, so we encode
 * the call, concatenate the suffix, and rebuild a raw prepared transaction.
 *
 * Use this for EOA-signed sends (`sendTransaction`) and the server wallet
 * (`enqueueTransaction`). For EIP-5792 `sendCalls` (smart accounts) the suffix
 * must land on the outer userOp instead — pass it via the `dataSuffix`
 * capability there (see VoteBar.tsx / Revoke.tsx).
 */
export async function withBuilderCode<
  abi extends Abi,
  abiFn extends AbiFunction,
>(
  transaction: PreparedTransaction<abi, abiFn>,
): Promise<PreparedTransaction> {
  const [data, to, value] = await Promise.all([
    encode(transaction),
    resolvePromisedValue(transaction.to),
    resolvePromisedValue(transaction.value),
  ]);

  return prepareTransaction({
    client: transaction.client,
    chain: transaction.chain,
    to,
    value,
    data: `${data}${DATA_SUFFIX.slice(2)}` as `0x${string}`,
  });
}

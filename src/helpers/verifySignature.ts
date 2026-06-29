import { type Address } from "viem";
import { verifySignature as thirdwebVerifySignature } from "thirdweb/auth";

import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "~/constants/chains";
import { client } from "~/server/utils";

/**
 * Verifies an Ethereum signature for SIWE login.
 *
 * Uses thirdweb's verifier, which handles:
 *  - EOA signatures (ECDSA recover)
 *  - ERC-1271 smart contract wallet signatures (deployed)
 *  - ERC-6492 smart contract wallet signatures (undeployed / counterfactual)
 *
 * Critically, this reuses the singleton thirdweb `client` and its HTTP RPC
 * instead of constructing a fresh `@wagmi/core` config + transport on every
 * call. Farcaster wallets are smart-contract wallets, so every mini-app
 * sign-in took the contract-verification path; the old per-call `createConfig`
 * leaked file descriptors and eventually crashed the warm lambda with
 * `EMFILE: too many open files`.
 */
const verifySignature = async (
  message: string,
  signature: string,
  address: Address,
  chainId: number = DEFAULT_CHAIN.id,
): Promise<boolean> => {
  const chain =
    SUPPORTED_CHAINS.find((c) => c.id === chainId) ?? DEFAULT_CHAIN;

  try {
    return await thirdwebVerifySignature({
      message,
      signature: signature as `0x${string}`,
      address,
      client,
      chain,
    });
  } catch (error) {
    console.error("verifySignature failed:", error);
    return false;
  }
};

export default verifySignature;

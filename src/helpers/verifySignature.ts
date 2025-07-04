import { createConfig, getPublicClient, http } from "@wagmi/core";
import {
  type Address,
  isAddress,
  isAddressEqual,
  verifyMessage,
  hashMessage,
  encodeFunctionData,
  zeroAddress,
} from "viem";
// Minimal ABI for ERC-1271 isValidSignature function
const smartAccountAbi = [
  {
    name: "isValidSignature",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "hash", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes4" }],
  },
] as const;
import type { Chain } from "wagmi/chains";

import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "~/constants";
import { env } from "~/env";

const verifySignature = async(
  message: string,
  signature: string,
  address: Address,
  chainId: number = DEFAULT_CHAIN.id,
): Promise<boolean> => {
  // First, try standard EOA signature verification
  try {
    return await verifyMessage({
      message,
      address,
      signature: signature as `0x${string}`,
    });
  } catch (error) {
    console.warn("Not an EOA signature, trying EIP-1271...", error);
  }

  // If EOA verification fails, try EIP-1271 verification
  if (isAddress(address) && !isAddressEqual(address, zeroAddress)) {
    try {
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (!chain) {
        throw new Error(`Chain ID ${chainId} not supported`);
      }
      const config = createConfig({ 
        chains: [chain as unknown as Chain],
        transports: { 
          [chain.id]: http(`https://${chain.id}.rpc.thirdweb.com/${env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`),
        }, 
      });
      const client = getPublicClient(config);
      if (!client) {
        throw new Error("Failed to create public client");
      }
      const hash = hashMessage(message);
      const data = encodeFunctionData({
        abi: smartAccountAbi,
        functionName: "isValidSignature",
        args: [hash, signature as `0x${string}`],
      });
      const result = await client.call({ account: address, to: address, data });
      return result.data === "0x1626ba7e";
    } catch (error) {
      console.error("EIP-1271 verification failed:", error)
    }
  }

  return false
}

export default verifySignature;

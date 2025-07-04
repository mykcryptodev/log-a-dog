import { createConfig, getPublicClient, http } from "@wagmi/core";
import {
  type Address,
  isAddress,
  isAddressEqual,
  verifyMessage,
  hashMessage,
  encodeFunctionData,
  decodeAbiParameters,
  zeroAddress,
} from "viem";
import { verify as verifyWebAuthn } from "webauthn-p256";
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

      // If the signature contains a WebAuthn payload, verify off-chain first
      if (signature.includes("776562617574686e2e676574")) {
        try {
          const [_wallet, rest] = decodeAbiParameters(
            [{ type: "address" }, { type: "bytes" }],
            signature as `0x${string}`,
          );
          const [sigBytes, pubKey, webauthn] = decodeAbiParameters(
            [
              { type: "bytes" },
              { type: "bytes" },
              {
                type: "tuple",
                components: [
                  { type: "bytes" },
                  { type: "string" },
                  { type: "uint256" },
                  { type: "uint256" },
                  { type: "bool" },
                ],
              },
            ],
            rest as `0x${string}`,
          );
          const valid = await verifyWebAuthn({
            hash,
            publicKey: pubKey as `0x${string}`,
            signature: sigBytes as `0x${string}`,
            webauthn: {
              authenticatorData: webauthn[0] as `0x${string}`,
              clientDataJSON: webauthn[1] as string,
              challengeIndex: Number(webauthn[2]),
              typeIndex: Number(webauthn[3]),
              userVerificationRequired: webauthn[4] as boolean,
            },
          });
          if (!valid) return false;
        } catch (err) {
          console.error("Local WebAuthn verification failed:", err);
        }
      }

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

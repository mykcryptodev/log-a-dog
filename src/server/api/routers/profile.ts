import { z } from "zod";
import { MODERATION, PROFILES } from "~/constants/addresses";
import { createThirdwebClient, getContract, isAddress } from "thirdweb";
import { readContract } from "thirdweb";
import { env } from "~/env";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getByAddress: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      address: z.string(),
    }))
    .query(async ({ input }) => {
      const { address, chainId } = input;
      const profile = await getProfile(address, chainId);
      return profile;
    }),
  getByUsername: publicProcedure
    .input(z.object({
      chainId: z.number(),
      username: z.string(),
    }))
    .query(async ({ input }) => {
      const chain = SUPPORTED_CHAINS.find((c) => c.id === input.chainId);
      const profileAddress = PROFILES[input.chainId];
      if (!profileAddress || !chain) {
        throw new Error("Chain not supported");
      }
      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });
      const profileContract = getContract({
        client,
        address: profileAddress,
        chain,
      });
      const address = await readContract({
        contract: profileContract,
        method: {
          name: "usedUsernames",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "username", type: "string" }],
          outputs: [{ name: "address", type: "address" }],
        },
        params: [input.username],
      });
      if (address) {
        const profile = await getProfile(address, input.chainId);
        return profile;
      }
      return null;
    }),
  getManyByAddress: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      addresses: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      const { addresses, chainId } = input;
      const profiles = await Promise.all(addresses.map((address) => getProfile(address, chainId)));
      return profiles;
    }),
  search: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      query: z.string(),
    }))
    .query(async ({ input }) => {
      const { query, chainId } = input;
      const profileAddress = PROFILES[chainId];
      const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
      if (!profileAddress || !chain) {
        throw new Error("Chain not supported");
      }
      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });
      const profileContract = getContract({
        client,
        address: profileAddress,
        chain,
      });
      if (isAddress(query)) {
        const result = await readContract({
          contract: profileContract,
          method: {
            name: "profiles",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "address", type: "address" }],
            outputs: [
              { name: "username", type: "string" },
              { name: "imgUrl", type: "string" },
              { name: "metadata", type: "string" },
            ],
          },
          params: [query],
        });
        if (result) {
          return {
            address: query,
            username: result[0],
            imgUrl: result[1],
            metadata: result[2],
          }
        }
      } else {
        const result = await readContract({
          contract: profileContract,
          method: {
            name: "usedUsernames",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "username", type: "string" }],
            outputs: [{ name: "address", type: "address" }],
          },
          params: [query],
        });
        if (result) {
          const profile = await getProfile(result, chainId);
          return profile
        }
      }
      return null;
    }),
});

async function getProfile (address: string, chainId: number) {
  const profileAddress = PROFILES[chainId];
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  const moderationAddress = MODERATION[chainId];
  if (!profileAddress || !chain || !moderationAddress) {
    throw new Error("Chain not supported");
  }
  const client = createThirdwebClient({
    secretKey: env.THIRDWEB_SECRET_KEY,
  });
  const profileContract = getContract({
    client,
    address: profileAddress,
    chain,
  });
  const moderationContract = getContract({
    client,
    address: moderationAddress,
    chain,
  });
  const [profile, isRedacted] = await Promise.all([
    readContract({
      contract: profileContract,
      method: {
        name: "profiles",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "address", type: "address" }],
        outputs: [
          { name: "username", type: "string" },
          { name: "imgUrl", type: "string" },
          { name: "metadata", type: "string" },
        ],
      },
      params: [address],
    }),
    readContract({
      contract: moderationContract,
      method: {
        name: "redactedAddresses",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "address", type: "address" }],
        outputs: [{ name: "redacted", type: "bool" }],
      },
      params: [address],
    }),
  ]);
  const redactedImage = "https://ipfs.io/ipfs/QmTsT4VEnakeaJNYorc1dVWfyAyLGTc1sMWpqnYzRq39Q4/avatar.webp";
  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    username: isRedacted ? shortenedAddress : profile[0],
    imgUrl: isRedacted ? redactedImage : profile[1],
    metadata: profile[2],
    address,
  };
}
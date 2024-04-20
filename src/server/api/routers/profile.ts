import { z } from "zod";
import { BETA_PROFILES, MODERATION, PROFILES } from "~/constants/addresses";
import { createThirdwebClient, getContract, isAddress } from "thirdweb";
import { readContract } from "thirdweb";
import { env } from "~/env";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { usedUsernames } from "~/thirdweb/8453/0x2da5e4bba4e18f9a8f985651a846f64129459849";

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
      const address = await usedUsernames({
        contract: profileContract,
        arg_0: input.username,
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
  const betaProfileAddress = BETA_PROFILES[chainId]!;
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  const moderationAddress = MODERATION[chainId];
  if (!profileAddress || !chain || !moderationAddress) {
    throw new Error("Chain not supported");
  }
  const client = createThirdwebClient({
    secretKey: env.THIRDWEB_SECRET_KEY,
  });
  const betaProfileContract = getContract({
    client,
    address: betaProfileAddress,
    chain,
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
  const [legacyProfile, profile, isRedacted] = await Promise.all([
    readContract({
      contract: betaProfileContract,
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
  const usedProfile = profile?.[0] !== '' ? profile : legacyProfile;
  console.log({ usedProfile, profile, legacyProfile, address });
  const redactedImage = "https://ipfs.io/ipfs/QmTsT4VEnakeaJNYorc1dVWfyAyLGTc1sMWpqnYzRq39Q4/avatar.webp";
  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    username: isRedacted ? shortenedAddress : usedProfile[0],
    imgUrl: isRedacted ? redactedImage : usedProfile[1],
    metadata: usedProfile[2],
    address,
  };
}
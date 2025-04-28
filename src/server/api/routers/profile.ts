import { z } from "zod";
import { BETA_PROFILES, MODERATION_V1, PROFILES } from "~/constants/addresses";
import { ADDRESS_ZERO, createThirdwebClient, getContract, isAddress } from "thirdweb";
import { readContract } from "thirdweb";
import { env } from "~/env";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { getProfile as getZoraProfile } from '@zoralabs/coins-sdk';

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { usedUsernames } from "~/thirdweb/8453/0x2da5e4bba4e18f9a8f985651a846f64129459849";

type NeynarUserResponse = Record<string, [
  {
    object: string;
    fid: number;
    custody_address: string;
    username: string;
    display_name: string;
    pfp_url: string;
    profile: {
      bio: {
        text: string;
      };
    };
    follower_count: number;
    following_count: number;
    verifications: string[];
    verified_addresses: {
      eth_addresses: string[];
      sol_addresses: string[];
    };
    active_status: string;
    power_badge: boolean;
  }
]>;

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

      const zoraProfile = await getZoraProfileData(input.username);
      if (zoraProfile) {
        return zoraProfile;
      }

      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });
      const profileContract = getContract({
        client,
        address: profileAddress,
        chain,
      });
      const legacyProfileContract = getContract({
        client,
        address: BETA_PROFILES[input.chainId]!,
        chain,
      });
      const [address, legacyAddress] = await Promise.all([
        usedUsernames({
          contract: profileContract,
          arg_0: input.username,
        }),
        usedUsernames({
          contract: legacyProfileContract,
          arg_0: input.username,
        }),
      ]);
      const usedAddress = address !== ADDRESS_ZERO ? address : legacyAddress;
      if (usedAddress) {
        const profile = await getProfile(usedAddress, input.chainId);
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

async function getZoraProfileData(addressOrUsername: string) {
  try {
    const response = await getZoraProfile({
      identifier: addressOrUsername,
    });
    
    if (response?.data?.profile) {
      const profile = response.data.profile;
      const zoraAddresses = [
        profile.publicWallet.walletAddress,
        ...profile.linkedWallets.edges.map(w => w.node.walletAddress),
      ];
      // the user's zora addresses must match the address we were given.
      if (zoraAddresses.includes(addressOrUsername)) {
        return {
          username: profile.displayName ?? profile.handle ?? '',
          imgUrl: profile.avatar?.medium ?? '',
          metadata: profile,
          address: profile.publicWallet.walletAddress,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching Zora profile:', error);
    return null;
  }
}

async function getProfile (address: string, chainId: number) {
  // First try to get Zora profile
  const zoraProfile = await getZoraProfileData(address);
  if (zoraProfile) {
    console.log('Zora profile found', zoraProfile);
    return zoraProfile;
  }

  const profileAddress = PROFILES[chainId];
  const betaProfileAddress = BETA_PROFILES[chainId]!;
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  const moderationAddress = MODERATION_V1[chainId];
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
  if (profile[0] === '' && legacyProfile[0] === '') {
    // check if the user has a neynar profile and return that if they do
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        api_key: env.NEYNAR_API_KEY,
      },
    });

    const neynarUser = await response.json() as NeynarUserResponse;
    if (neynarUser[address]) {
      const user = neynarUser[address]?.[0];
      if (user) {
        return {
          username: user.display_name ?? user.username,
          imgUrl: user.pfp_url,
          metadata: '',
          address,
        };
      }
    }
  }
  const usedProfile = profile?.[0] !== '' ? profile : legacyProfile;
  const redactedImage = "https://ipfs.io/ipfs/QmTsT4VEnakeaJNYorc1dVWfyAyLGTc1sMWpqnYzRq39Q4/avatar.webp";
  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    username: isRedacted ? shortenedAddress : usedProfile[0],
    imgUrl: isRedacted ? redactedImage : usedProfile[1],
    metadata: usedProfile[2],
    address,
  };
}
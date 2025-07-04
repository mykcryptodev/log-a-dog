/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { z } from "zod";
import { getProfile as getZoraProfile } from '@zoralabs/coins-sdk';
import { getOrSetCache, CACHE_DURATION, deleteCachedData } from "~/server/utils/redis";
import { neynarClient } from "~/lib/neynar";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const profileRouter = createTRPCRouter({
  getByAddress: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      address: z.string(),
    }))
    .query(async ({ input }) => {
      const { address, chainId } = input;
      console.log({ address, chainId });
      const cacheKey = `profile:${chainId}:${address}`;
      console.log({ cacheKey });
      const profile = await getOrSetCache(
        cacheKey,
        async () => {
          const profile = await getProfile(address.toLowerCase());
          return profile;
        },
        CACHE_DURATION.MEDIUM
      );
      console.log({ profile });
      return profile;
    }),
  getByUsername: publicProcedure
    .input(z.object({
      chainId: z.number(),
      username: z.string(),
    }))
    .query(async ({ input }) => {
      const { chainId, username } = input;
      const cacheKey = `profile:${chainId}:username:${username}`;
      return getOrSetCache(
        cacheKey,
        async () => {
          const profile = await getProfile(username);
          return profile;
        },
        CACHE_DURATION.MEDIUM
      );
    }),
  getById: publicProcedure
    .input(z.object({
      chainId: z.number(),
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { id, chainId } = input;
      const user = await ctx.db.user.findUniqueOrThrow({
        where: {
          id,
        },
      });
      const { address } = user;
      if (!address) {
        throw new Error("User address not found");
      }
      const cacheKey = `profile:${chainId}:${address.toLowerCase()}`;
      return getOrSetCache(
        cacheKey,
        async () => {
          const profile = await getProfile(address);
          return profile;
        },
        CACHE_DURATION.MEDIUM
      );
    }),
  getManyByAddress: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      addresses: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      const { addresses, chainId } = input;
      const profiles = await Promise.all(
        addresses.map(async (address) => {
          const cacheKey = `profile:${chainId}:${address.toLowerCase()}`;
          return getOrSetCache(
            cacheKey,
            async () => {
              const profile = await getProfile(address);
              return profile;
            },
            CACHE_DURATION.MEDIUM
          );
        })
      );
      return profiles;
    }),
  search: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      query: z.string(),
    }))
    .query(async ({ input }) => {
      const { query, chainId } = input;
      const cacheKey = `profile:${chainId}:search:${query.toLowerCase()}`;
      return getOrSetCache(
        cacheKey,
        async () => {
          const users = await db.user.findMany({
            where: {
              username: {
                contains: query,
              },
            },
            select: {
              username: true,
              image: true,
              name: true,
              fid: true,
              address: true,
            },
            take: 10,
          });
          return users.map((user) => ({
            username: user.username ?? '',
            imgUrl: user.image ?? '',
            metadata: '',
            address: user.address,
          }));
        },
        CACHE_DURATION.MEDIUM
      );
    }),
  create: publicProcedure
    .input(z.object({
      chainId: z.number(),
      address: z.string(),
      username: z.string(),
      imgUrl: z.string(),
      metadata: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { chainId, address, username, imgUrl } = input;
      
      // Save profile data to database
      // First try to find existing user by address
      let user = await db.user.findFirst({
        where: {
          address: address.toLowerCase(),
        },
      });

      if (user) {
        // Update existing user
        user = await db.user.update({
          where: {
            id: user.id,
          },
          data: {
            username,
            image: imgUrl,
            name: username, // Use username as display name for now
          },
        });
      } else {
        // Create new user
        user = await db.user.create({
          data: {
            address: address.toLowerCase(),
            username,
            image: imgUrl,
            name: username, // Use username as display name for now
          },
        });
      }

      // Invalidate Redis cache for all profile queries for this chain
      const pattern = `profile:${chainId}:*`;
      await deleteCachedData(pattern);

      // Return a success indicator instead of queueId since we're not using blockchain
      return { success: true, userId: user.id };
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

async function getProfile (address: string) {
  // First check if we have user data in our database (from sessionData)
  const dbUser = await db.user.findFirst({
    where: {
      address: address.toLowerCase(),
    },
    select: {
      username: true,
      image: true,
      name: true,
      fid: true,
    },
  });

  // If we have database user data with username and image, use that
  if (dbUser?.username && dbUser?.image) {
    return {
      username: dbUser.username,
      imgUrl: dbUser.image,
      metadata: '',
      address,
    };
  }

  // First try to get Zora profile
  const zoraProfile = await getZoraProfileData(address);
  if (zoraProfile) {
    console.log('Zora profile found', zoraProfile);
    return zoraProfile;
  }

  try {
    const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
      addresses: [address],
    });
    
    const addressKey = address.toLowerCase();
    const user = response[addressKey]?.[0];
    
    if (user) {
      return {
        username: user.display_name ?? user.username,
        imgUrl: user.pfp_url,
        metadata: '',
        address,
      };
    }
  } catch (error) {
    console.error("Error fetching from Neynar:", error);
  }

  return {
    username: '',
    imgUrl: '',
    metadata: '',
    address,
  };
}
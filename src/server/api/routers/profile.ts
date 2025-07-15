import { z } from "zod";
import { getOrSetCache, CACHE_DURATION, deleteCachedData } from "~/server/utils/redis";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { containsProfanity } from "~/utils/profanity";
import { getProfile, getCachedProfile } from "~/server/utils/profile";

export const profileRouter = createTRPCRouter({
  getByAddress: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      address: z.string(),
    }))
    .query(async ({ input }) => {
      const { address, chainId } = input;
      console.log({ address, chainId });
      const profile = await getCachedProfile(address.toLowerCase(), chainId);
      console.log({ profile });
      return profile;
    }),
  getByUsername: publicProcedure
    .input(z.object({
      chainId: z.number(),
      username: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { chainId, username } = input;
      const cacheKey = `profile:${chainId}:username:${username}`;
      return getOrSetCache(
        cacheKey,
        async () => {
          // Look up the address associated with this username if we have it
          const user = await ctx.db.user.findFirst({
            where: { username },
            select: { address: true },
          });

          const identifier = user?.address ?? username;
          const profile = await getProfile(identifier);
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
      return getCachedProfile(address, chainId);
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
          return getCachedProfile(address, chainId);
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

      if (containsProfanity(username)) {
        throw new Error("Username contains profanity or slurs");
      }
      
      // Save profile data to database
      // First try to find existing user by address
      let user = await db.user.findFirst({
        where: {
          address: address.toLowerCase(),
        },
      });

      if (user?.fid) {
        throw new Error("Verified users cannot change their username");
      }

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


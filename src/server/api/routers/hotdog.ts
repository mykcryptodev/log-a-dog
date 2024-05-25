import { z } from "zod";
import { LOG_A_DOG, MODERATION } from "~/constants/addresses";
import { getContract } from "thirdweb";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { client } from "~/server/utils";
import { getHotdogLogs, getLeaderboard, getTotalPages, getTotalPagesForLogs, getUserHotdogLogsPaginated } from "~/thirdweb/84532/0x1bf5c7e676c8b8940711613086052451dcf1681d";
import { getRedactedLogIds } from "~/thirdweb/84532/0x22394188550a7e5b37485769f54653e3bc9c6674";

const redactedImage = "https://ipfs.io/ipfs/QmXZ8SpvGwRgk3bQroyM9x9dQCvd87c23gwVjiZ5FMeXGs/Image%20(1).png";

export const hotdogRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      user: z.string(),
      start: z.number(),
      limit: z.number(),
    }))
    .query(async ({ input }) => {
      const { chainId, user, start, limit } = input;
      console.log({ input })
      const [redactedLogIds, totalPages, dogResponse] = await Promise.all([
        getRedactedLogIds({
          contract: getContract({
            address: MODERATION[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
        }),
        getTotalPagesForLogs({
          contract: getContract({
            address: LOG_A_DOG[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          startTime: BigInt(new Date('2024-05-23T12:00:00-04:00').getTime() / 1000),
          endTime: BigInt(new Date('2024-09-05T12:00:00-04:00').getTime() / 1000),
          pageSize: BigInt(limit),
        }),
        getHotdogLogs({
          contract: getContract({
            address: LOG_A_DOG[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          startTime: BigInt(new Date('2024-05-23T12:00:00-04:00').getTime() / 1000),
          endTime: BigInt(new Date('2024-09-05T12:00:00-04:00').getTime() / 1000),
          user,
          start: BigInt(start),
          limit: BigInt(limit)
        }),
      ]);
      console.log({ dogResponse, totalPages });
      const currentPage = Math.floor(Number(start) / Number(limit)) + 1;
      const hasNextPage = currentPage < totalPages;

      const moderatedHotdogs = dogResponse[0].map(hotdog => {
        if (redactedLogIds.includes(hotdog.logId)) {
          return {
            ...hotdog,
            imageUri: redactedImage,
          }
        }
        return hotdog;
      });

      return {
        hotdogs: moderatedHotdogs,
        validAttestations: dogResponse[1],
        invalidAttestations: dogResponse[2],
        userAttested: dogResponse[3],
        userAttestations: dogResponse[4],
        totalPages,
        hasNextPage,
      }
    }),
  getAllForUser: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      user: z.string(),
      limit: z.number(),
    }))
    .query(async ({ input }) => {
      const { chainId, user, limit } = input;
      const totalPages = await getTotalPages({
        contract: getContract({
          address: LOG_A_DOG[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        pageSize: BigInt(limit),
        user,
      });
      const dogResponse = await getUserHotdogLogsPaginated({
        contract: getContract({
          address: LOG_A_DOG[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        user,
        start: BigInt(0),
        limit: BigInt(limit)
      });
      const currentPage = 1;
      const hasNextPage = currentPage < totalPages;
      return {
        hotdogs: dogResponse[0],
        validAttestations: dogResponse[1],
        invalidAttestations: dogResponse[2],
        totalPages,
        hasNextPage,
      }
    }),
  getLeaderboard: publicProcedure
    .input(z.object({ chainId: z.number() }))
    .query(async ({ input }) => {
      const { chainId } = input;
      const leaderboardResponse = await getLeaderboard({
        contract: getContract({
          address: LOG_A_DOG[input.chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        startTime: BigInt(new Date('2024-05-23T12:00:00-04:00').getTime() / 1000),
        endTime: BigInt(new Date('2024-09-05T12:00:00-04:00').getTime() / 1000),
      });
      console.log({ leaderboardResponse });
      return {
        users: leaderboardResponse[0],
        hotdogs: leaderboardResponse[1],
      };
    }),
});
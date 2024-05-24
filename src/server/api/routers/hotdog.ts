import { z } from "zod";
import { LOG_A_DOG } from "~/constants/addresses";
import { getContract } from "thirdweb";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { client } from "~/server/utils";
import { getHotdogLogs } from "~/thirdweb/84532/0xdc0b97c9121f83cbe6852a844d91f7cae9ee422f";

export const hotdogRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      user: z.string(),
    }))
    .query(async ({ input }) => {
      const { chainId, user } = input;
      console.log({ chainId, logAdog: LOG_A_DOG[chainId], supported: SUPPORTED_CHAINS[chainId] });
      const dogResponse = await getHotdogLogs({
        contract: getContract({
          address: LOG_A_DOG[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        startTime: BigInt(new Date('2024-05-23T12:00:00-04:00').getTime() / 1000),
        endTime: BigInt(new Date('2024-09-05T12:00:00-04:00').getTime() / 1000),
        user,
      });
      return {
        hotdogs: dogResponse[0],
        validAttestations: dogResponse[1],
        invalidAttestations: dogResponse[2],
        userAttested: dogResponse[3],
        userAttestations: dogResponse[4],
      }
    }),
});
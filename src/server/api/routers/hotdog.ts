import { z } from "zod";
import { AI_AFFIRMATION, LOG_A_DOG, MODERATION } from "~/constants/addresses";
import { getContract } from "thirdweb";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { client } from "~/server/utils";
import { getHotdogLogs, getLeaderboard, getTotalPagesForLogs } from "~/thirdweb/84532/0x1bf5c7e676c8b8940711613086052451dcf1681d";
import { getRedactedLogIds } from "~/thirdweb/84532/0x22394188550a7e5b37485769f54653e3bc9c6674";
import { env } from "~/env";

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
          start: BigInt(0),
          limit: BigInt(limit)
        }),
      ]);
      const currentPage = 1;
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
        totalPages,
        hasNextPage,
      }
    }),
  getAiVerificationStatus: publicProcedure
    .input(z.object({ chainId: z.number(), logId: z.string(), timestamp: z.string() }))
    .query(async ({ input }) => {
      const { chainId, timestamp, logId } = input;
      const hotdogLogResponse = await getHotdogLogs({
        contract: getContract({
          address: LOG_A_DOG[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        startTime: BigInt(timestamp),
        endTime: BigInt(timestamp),
        user: AI_AFFIRMATION[chainId]!,
        start: BigInt(0),
        limit: BigInt(10),
      });
      const hotdogLogs = hotdogLogResponse[0];

      const logIndex = hotdogLogs.findIndex(log => log.logId.toString() === logId);
      const hotdogLog = hotdogLogs.find(log => log.logId.toString() === logId);

      if (!hotdogLog) {
        throw new Error("Hotdog log not found");
      }
      const aiHasAttested = hotdogLogResponse[3][logIndex];

      if (!aiHasAttested) {
        return "NOT_ATTESTED";
      }

      const aiAttestation = hotdogLogResponse[4][logIndex];

      if (aiAttestation === undefined) {
        throw new Error("AI attestation not found");
      }

      return aiAttestation ? "VERIFIED" : "REJECTED";

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
      return {
        users: leaderboardResponse[0],
        hotdogs: leaderboardResponse[1],
      };
    }),
  checkForSafety: publicProcedure
    .input(z.object({ base64ImageString: z.string() }))
    .mutation(async ({ input }) => {
      const { base64ImageString } = input;
      const base64Data = base64ImageString.replace(/^data:image\/\w+;base64,/, "");
      const url = `https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_VISION_API_KEY}`;
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Data
            },
            features: [
              {
                type: "SAFE_SEARCH_DETECTION"
              },
            ],
          },
        ],
      };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          console.log({ responseBody: response.body, text: response.text(), status: response.statusText });
          throw new Error(`Error: ${response.statusText}`);
        }

        interface SafeSearchAnnotation {
          adult: string;
          violence: string;
          medical: string;
          racy: string;
        }

        interface SafetyCheckResponse {
          responses: {
            safeSearchAnnotation?: SafeSearchAnnotation;
          }[];
        }

        const safetyCheckResult: SafetyCheckResponse = await response.json() as SafetyCheckResponse;
        const safeSearchAnnotation = safetyCheckResult.responses[0]?.safeSearchAnnotation;

        if (!safeSearchAnnotation) {
          throw new Error("SafeSearchAnnotation is missing in the response");
        }

        console.log({ safeSearchAnnotation });
        const isSafeForWork = safeSearchAnnotation.adult !== "VERY_LIKELY";
        const isSafeForViolence = safeSearchAnnotation.violence !== "VERY_LIKELY";
        const isSafeForMedical = safeSearchAnnotation.medical !== "VERY_LIKELY";

        return isSafeForWork && isSafeForViolence && isSafeForMedical;
      } catch (error) {
        console.error("Error posting image for safety check:", error);
        throw error;
      }
    }),
});
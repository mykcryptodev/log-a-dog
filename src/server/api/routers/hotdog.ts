import { z } from "zod";
import { AI_AFFIRMATION, LOG_A_DOG, MODERATION } from "~/constants/addresses";
import { getContract } from "thirdweb";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { client } from "~/server/utils";
import { getHotdogLogs, getLeaderboard, getTotalPagesForLogs } from "~/thirdweb/84532/0xd672307b4fefae064e4e59bfbfc1e24776f57a33";
import { getRedactedLogIds } from "~/thirdweb/84532/0x22394188550a7e5b37485769f54653e3bc9c6674";
import { env } from "~/env";
import { createThirdwebClient } from 'thirdweb';
import { download } from 'thirdweb/storage';
import { getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';
import { getCachedData, getOrSetCache, setCachedData, CACHE_DURATION } from "~/server/utils/redis";
import { CONTEST_END_TIME, CONTEST_START_TIME } from "~/constants";

const redactedImage = "https://ipfs.io/ipfs/QmXZ8SpvGwRgk3bQroyM9x9dQCvd87c23gwVjiZ5FMeXGs/Image%20(1).png";

// Types for metadata
interface ZoraCoin {
  address: string;
  name: string;
  symbol: string;
}

interface ZoraCoinDetails {
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  totalVolume: string;
  volume24h: string;
  createdAt?: string;
  creatorAddress?: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  chainId?: number;
  uniqueHolders?: number;
}

interface HotdogMetadata {
  imageUri: string;
  eater: string;
  zoraCoin?: ZoraCoin;
}

interface HotdogLog {
  logId: string;
  imageUri: string;
  metadataUri: string;
  timestamp: string;
  eater: string;
  logger: string;
}

interface HotdogResponse {
  logs: HotdogLog[];
  validCounts: string[];
  invalidCounts: string[];
  userHasAttested: boolean[];
  userAttestations: boolean[];
}

interface ProcessedHotdog {
  logId: string;
  imageUri: string;
  metadataUri: string;
  timestamp: string;
  eater: string;
  logger: string;
  zoraCoin: ZoraCoinDetails | null;
}

interface GetAllResponse {
  hotdogs: ProcessedHotdog[];
  validAttestations: string[];
  invalidAttestations: string[];
  userAttested: boolean[];
  userAttestations: boolean[];
  totalPages: number;
  hasNextPage: boolean;
}

// Create thirdweb client for IPFS operations
const thirdwebClient = createThirdwebClient({
  secretKey: env.THIRDWEB_SECRET_KEY,
});

// Helper function to fetch and parse metadata from IPFS
async function getMetadataFromUri(uri: string): Promise<HotdogMetadata | null> {
  const cacheKey = `metadata:${uri}`;
  
  return getOrSetCache(
    cacheKey,
    async () => {
      try {
        const response = await download({ client: thirdwebClient, uri });
        const metadata = response as unknown as HotdogMetadata;
        return metadata;
      } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
      }
    },
    CACHE_DURATION.LONG
  );
}

// Helper function to fetch Zora coin details in batch
async function getZoraCoinDetailsBatch(addresses: string[]): Promise<Map<string, ZoraCoinDetails>> {
  const coinDetailsMap = new Map<string, ZoraCoinDetails>();
  
  // Process addresses in chunks to avoid overwhelming the API
  const chunkSize = 50;
  for (let i = 0; i < addresses.length; i += chunkSize) {
    const chunk = addresses.slice(i, i + chunkSize);
    const promises = chunk.map(async (address) => {
      const cacheKey = `zora-coin:${address}`;
      
      const cachedData = await getCachedData<ZoraCoinDetails>(cacheKey);
      if (cachedData) {
        coinDetailsMap.set(address, cachedData);
        return;
      }

      try {
        const response = await getCoin({
          address: address as `0x${string}`,
          chain: base.id,
        });
        if (response.data?.zora20Token) {
          coinDetailsMap.set(address, response.data.zora20Token);
          await setCachedData(cacheKey, response.data.zora20Token, CACHE_DURATION.MEDIUM);
        }
      } catch (error) {
        console.error(`Error fetching Zora coin details for ${address}:`, error);
      }
    });
    await Promise.all(promises);
  }
  
  return coinDetailsMap;
}

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

      // Generate cache key for this query
      const cacheKey = `hotdogs:${chainId}:${user}:${start}:${limit}`;
      
      // Try to get cached data first
      const cachedData = await getCachedData<GetAllResponse>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

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
          startTime: BigInt(new Date(CONTEST_START_TIME).getTime() / 1000),
          endTime: BigInt(new Date(CONTEST_END_TIME).getTime() / 1000),
          pageSize: BigInt(limit),
        }),
        getHotdogLogs({
          contract: getContract({
            address: LOG_A_DOG[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          startTime: BigInt(new Date(CONTEST_START_TIME).getTime() / 1000),
          endTime: BigInt(new Date(CONTEST_END_TIME).getTime() / 1000),
          user,
          start: BigInt(start),
          limit: BigInt(limit)
        }),
      ]) as unknown as [readonly bigint[], bigint, [
        Array<{
          logId: bigint;
          imageUri: string;
          metadataUri: string;
          timestamp: bigint;
          eater: string;
          logger: string;
        }>,
        bigint[],
        bigint[],
        boolean[],
        boolean[]
      ]];

      // Convert redactedLogIds from readonly bigint[] to string[]
      const redactedLogIdsStr = Array.from(redactedLogIds).map(id => id.toString());

      // Convert the raw response to our string-based types
      const processedResponse: HotdogResponse = {
        logs: dogResponse[0].map(log => ({
          ...log,
          logId: log.logId.toString(),
          timestamp: log.timestamp.toString(),
        })),
        validCounts: dogResponse[1].map(count => count.toString()),
        invalidCounts: dogResponse[2].map(count => count.toString()),
        userHasAttested: dogResponse[3],
        userAttestations: dogResponse[4],
      };

      // Process logs and get Zora coin details
      const processedHotdogs = await Promise.all(
        processedResponse.logs
          .filter(log => !redactedLogIdsStr.includes(log.logId))
          .map(async (log) => {
            const metadata = await getMetadataFromUri(log.metadataUri);
            const zoraCoin = metadata?.zoraCoin?.address
              ? await getZoraCoinDetailsBatch([metadata.zoraCoin.address])
              : null;
            
            return {
              ...log,
              zoraCoin: zoraCoin?.get(metadata?.zoraCoin?.address ?? '') ?? null,
            } as ProcessedHotdog;
          })
      );

      const response: GetAllResponse = {
        hotdogs: processedHotdogs,
        validAttestations: processedResponse.validCounts,
        invalidAttestations: processedResponse.invalidCounts,
        userAttested: processedResponse.userHasAttested,
        userAttestations: processedResponse.userAttestations,
        totalPages: Number(totalPages),
        hasNextPage: start + limit < Number(totalPages),
      };

      // Cache the processed data
      await setCachedData(cacheKey, response);

      return response;
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
          startTime: BigInt(new Date(CONTEST_START_TIME).getTime() / 1000),
          endTime: BigInt(new Date(CONTEST_END_TIME).getTime() / 1000),
          pageSize: BigInt(limit),
        }),
        getHotdogLogs({
          contract: getContract({
            address: LOG_A_DOG[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          startTime: BigInt(new Date(CONTEST_START_TIME).getTime() / 1000),
          endTime: BigInt(new Date(CONTEST_END_TIME).getTime() / 1000),
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
        startTime: BigInt(new Date(CONTEST_START_TIME).getTime() / 1000),
        endTime: BigInt(new Date(CONTEST_END_TIME).getTime() / 1000),
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

import { z } from "zod";
import { AI_AFFIRMATION, LOG_A_DOG, MODERATION } from "~/constants/addresses";
import { getContract } from "thirdweb";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { client } from "~/server/utils";
import { getHotdogLogs, getLeaderboard, getTotalPagesForLogs } from "~/thirdweb/84532/0xa8c9ecb6af528c69db3db340b3fe77888a39309c";
import { getRedactedLogIds } from "~/thirdweb/84532/0x22394188550a7e5b37485769f54653e3bc9c6674";
import { env } from "~/env";
import { createThirdwebClient } from 'thirdweb';
import { download } from 'thirdweb/storage';
import { getCoins } from '@zoralabs/coins-sdk';
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
  zoraCoin: string;
}

interface HotdogResponse {
  logs: Array<{
    logId: string;
    imageUri: string;
    metadataUri: string;
    timestamp: string;
    eater: string;
    logger: string;
    zoraCoin: string;
  }>;
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
  metadata: HotdogMetadata | null;
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
  if (uri === '') {
    return null
  }
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
async function getZoraCoinDetailsBatch(addresses: string[], chainId: number): Promise<Map<string, ZoraCoinDetails>> {
  const coinDetailsMap = new Map<string, ZoraCoinDetails>();
  
  // Process addresses in chunks to avoid overwhelming the API
  const chunkSize = 50;
  for (let i = 0; i < addresses.length; i += chunkSize) {
    const chunk = addresses.slice(i, i + chunkSize);
    const cacheKey = `zora-coins:${chunk.join(',')}`;
    
    const cachedData = await getCachedData<ZoraCoinDetails[]>(cacheKey);
    if (cachedData) {
      cachedData.forEach(coin => {
        if (coin?.address) {
          coinDetailsMap.set(coin.address, coin);
        }
      });
      continue;
    }

    try {
      console.log('Fetching Zora coins for addresses:', chunk);
      const response = await getCoins({
        coins: chunk.map(address => ({
          collectionAddress: address as `0x${string}`,
          chainId,
        })),
      });
      
      if (response.data?.zora20Tokens) {
        response.data.zora20Tokens.forEach(coin => {
          if (coin?.address) {
            coinDetailsMap.set(coin.address.toLowerCase(), coin);
          } else {
            console.log('Skipping coin with no address:', coin);
          }
        });
        await setCachedData(cacheKey, response.data.zora20Tokens, CACHE_DURATION.MEDIUM);
      } else {
        console.log('No zora20Tokens in response:', response);
      }
    } catch (error) {
      console.error(`Error fetching Zora coin details for batch:`, error);
      // Continue with next chunk even if this one fails
    }
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
      console.log({
        chainId,
        user,
        start,
        limit
      });

      // Generate cache key for this query
      const cacheKey = `hotdogs:${chainId}:${user}:${start}:${limit}`;
      
      // Try to get cached data first
      const cachedData = await getCachedData<GetAllResponse>(cacheKey);
      
      if (cachedData) {
        console.log('found!')
        // return cachedData;
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
      ]);
      
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
        userHasAttested: [...dogResponse[3]],
        userAttestations: [...dogResponse[4]],
      };

      // Process logs and get Zora coin details
      const filteredLogs = processedResponse.logs.filter(log => !redactedLogIdsStr.includes(log.logId));

      const zoraCoinAddresses = new Set<string>();
      const metadataUris = new Set<string>();
      
      filteredLogs.forEach(log => {
        // Collect unique values
        if (log.zoraCoin) zoraCoinAddresses.add(log.zoraCoin);
        if (log.metadataUri) metadataUris.add(log.metadataUri);
      });
      
      // Convert Sets to arrays
      const zoraCoinAddressesArray = [...zoraCoinAddresses];
      const metadataUrisArray = [...metadataUris];

      // Fetch all Zora coin details and metadata in parallel
      const [zoraCoinDetails, metadataResults] = await Promise.all([
        zoraCoinAddressesArray.length > 0
          ? getZoraCoinDetailsBatch(zoraCoinAddressesArray, chainId)
          : new Map<string, ZoraCoinDetails>(),
        Promise.all(metadataUrisArray.map(uri => getMetadataFromUri(uri)))
      ]); 

      console.log({ zoraCoinDetails, metadataResults });

      // Create maps for the fetched data
      const metadataMap = new Map(
        metadataUrisArray.map((uri, index) => [uri, metadataResults[index]])
      );

      // Process logs with both Zora coin details and metadata
      const processedHotdogs = filteredLogs.map(log => {
        const zoraCoin = zoraCoinDetails.get(log.zoraCoin.toLowerCase()) ?? null;
        const metadata = metadataMap.get(log.metadataUri.toLowerCase()) ?? null;

        return {
          ...log,
          zoraCoin,
          metadata,
        } as ProcessedHotdog;
      });

      console.log('Processed hotdogs:', processedHotdogs);

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

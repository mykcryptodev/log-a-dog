import { z } from "zod";
import { AI_AFFIRMATION, ATTESTATION_MANAGER, LOG_A_DOG, MODERATION, STAKING } from "~/constants/addresses";
import { getContract } from "thirdweb";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { client, serverWallet } from "~/server/utils";
import { getHotdogLogs, getTotalPagesForLogs, logHotdogOnBehalf, getHotdogLogsCount, getHotdogLogsRange } from "~/thirdweb/84532/0x0b04ceb7542cc13e0e483e7b05907c31dbee4d7f";
import { getRedactedLogIds } from "~/thirdweb/84532/0x22394188550a7e5b37485769f54653e3bc9c6674";
import { attestToLogOnBehalf, MINIMUM_ATTESTATION_STAKE } from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { env } from "~/env";
import { download } from 'thirdweb/storage';
import { getCoins } from '@zoralabs/coins-sdk';
import { getCachedData, getOrSetCache, setCachedData, CACHE_DURATION, deleteCachedData } from "~/server/utils/redis";
import { CONTEST_END_TIME, CONTEST_START_TIME } from "~/constants";
import { encodePoolConfig } from "~/server/utils/poolConfig";
import { upload } from "thirdweb/storage";
import { canParticipateInAttestation } from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";
import { getUserAttestationsWithChoices } from "~/thirdweb/84532/0xfbc7552a4bc2eaa35ba5e7644b67f3f05b161a56";
import { getAttestationCounts } from "~/thirdweb/84532/0xc470f55c2877848f1acfcf3b656e01dce03e9ec3";

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
        const response = await download({ client, uri });
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
      console.log('GET ALL')
      // Generate cache key for this query
      const cacheKey = `hotdogs:${chainId}:${user}:${start}:${limit}`;
      
      // Try to get cached data first
      const cachedData = await getCachedData<GetAllResponse>(cacheKey);
      
      console.log({ cachedData })

      if (cachedData) {
        return cachedData;
      }

      const [redactedLogIds, totalPages, dogResponse, userAttestations] = await Promise.all([
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
        getUserAttestationsWithChoices({
          contract: getContract({
            address: ATTESTATION_MANAGER[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          user,
        })
      ]);

      // Get attestation counts for each log ID
      const attestationCounts = await getAttestationCounts({
        contract: getContract({
          address: ATTESTATION_MANAGER[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        logIds: dogResponse[0].map(log => log.logId),
      });

      console.log({ dogResponse })
      // Convert redactedLogIds from readonly bigint[] to string[]
      const redactedLogIdsStr = Array.from(redactedLogIds).map(id => id.toString());

      console.log({ redactedLogIds })

      // Convert the raw response to our string-based types
      const processedResponse: HotdogResponse = {
        logs: dogResponse[0].map(log => ({
          ...log,
          logId: log.logId.toString(),
          timestamp: log.timestamp.toString(),
          // Replace image with redacted version if log is redacted
          imageUri: redactedLogIdsStr.includes(log.logId.toString()) ? redactedImage : log.imageUri
        })),
        // Get valid/invalid counts from attestationCounts response
        validCounts: attestationCounts[0].map(count => count.toString()),
        invalidCounts: attestationCounts[1].map(count => count.toString()),
        userHasAttested: dogResponse[0].map(log => userAttestations[0].includes(BigInt(log.logId))),
        userAttestations: dogResponse[0].map(log => userAttestations[1][userAttestations[0].findIndex(id => id === BigInt(log.logId))] ?? false),
      };

      console.log({ processedResponse })

      const zoraCoinAddresses = new Set<string>();
      const metadataUris = new Set<string>();
      
      processedResponse.logs.forEach(log => {
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

      // Create maps for the fetched data
      const metadataMap = new Map(
        metadataUrisArray.map((uri, index) => [uri, metadataResults[index]])
      );

      // Process logs with both Zora coin details and metadata
      const processedHotdogs = processedResponse.logs.map(log => {
        const zoraCoin = zoraCoinDetails.get(log.zoraCoin.toLowerCase()) ?? null;
        const metadata = metadataMap.get(log.metadataUri.toLowerCase()) ?? null;

        return {
          ...log,
          zoraCoin,
          metadata,
        } as ProcessedHotdog;
      });

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

      // filter the hotdogs that were not eaten by the user
      const userHotdogs = moderatedHotdogs.filter(hotdog => hotdog.eater.toLowerCase() === user.toLowerCase());

      return {
        hotdogs: userHotdogs,
        validAttestations: dogResponse[1],
        invalidAttestations: dogResponse[2],
        totalPages,
        hasNextPage,
      }
    }),
  getById: publicProcedure
    .input(z.object({
      chainId: z.number(),
      user: z.string(),
      logId: z.string(),
    }))
    .query(async ({ input }) => {
      const { chainId, user, logId } = input;

      const cacheKey = `hotdog:${chainId}:${logId}:${user}`;
      const cachedData = await getCachedData<{
        hotdog: ProcessedHotdog;
        validAttestations: string;
        invalidAttestations: string;
        userAttested: boolean;
        userAttestation: boolean;
      }>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const [redactedLogIds, dogResponse, attestationCounts, userAttestations] = await Promise.all([
        getRedactedLogIds({
          contract: getContract({
            address: MODERATION[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
        }),
        getHotdogLogsRange({
          contract: getContract({
            address: LOG_A_DOG[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          start: BigInt(logId),
          limit: 1n,
        }),
        getAttestationCounts({
          contract: getContract({
            address: ATTESTATION_MANAGER[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          logIds: [BigInt(logId)],
        }),
        getUserAttestationsWithChoices({
          contract: getContract({
            address: ATTESTATION_MANAGER[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          user,
        }),
      ]);

      const hotdogLog = dogResponse?.[0];
      if (!hotdogLog) {
        return null;
      }

      const redactedLogIdsStr = Array.from(redactedLogIds).map(id => id.toString());
      const processedResponse: HotdogResponse = {
        logs: [
          {
            ...hotdogLog,
            logId: hotdogLog.logId.toString(),
            timestamp: hotdogLog.timestamp.toString(),
            imageUri: redactedLogIdsStr.includes(hotdogLog.logId.toString()) ? redactedImage : hotdogLog.imageUri,
          },
        ],
        validCounts: [attestationCounts[0]?.[0]?.toString() ?? '0'],
        invalidCounts: [attestationCounts[1]?.[0]?.toString() ?? '0'],
        userHasAttested: [userAttestations[0].includes(BigInt(hotdogLog.logId))],
        userAttestations: [userAttestations[1][userAttestations[0].findIndex(id => id === BigInt(hotdogLog.logId))] ?? false],
      };

      const zoraCoinAddressesArray = processedResponse.logs[0]?.zoraCoin ? [processedResponse.logs[0].zoraCoin] : [];
      const [zoraCoinDetails, metadata] = await Promise.all([
        zoraCoinAddressesArray.length > 0 ? getZoraCoinDetailsBatch(zoraCoinAddressesArray, chainId) : new Map<string, ZoraCoinDetails>(),
        getMetadataFromUri(processedResponse.logs[0]?.metadataUri ?? ''),
      ]);

      const processedHotdog: ProcessedHotdog = {
        ...processedResponse.logs[0]!,
        zoraCoin: processedResponse.logs[0]?.zoraCoin ? zoraCoinDetails.get(processedResponse.logs[0].zoraCoin.toLowerCase()) ?? null : null,
        metadata,
      };

      const response = {
        hotdog: processedHotdog,
        validAttestations: processedResponse.validCounts[0],
        invalidAttestations: processedResponse.invalidCounts[0],
        userAttested: processedResponse.userHasAttested[0],
        userAttestation: processedResponse.userAttestations[0],
      };

      await setCachedData(cacheKey, response);

      return response;
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
    .input(z.object({ 
      chainId: z.number(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const { chainId, startDate, endDate } = input;
      
      // Generate cache key for this query
      const cacheKey = `leaderboard:${chainId}:${startDate ?? 'all'}:${endDate ?? 'all'}`;
      
      // Try to get cached data first
      const cachedData = await getCachedData<{ users: string[], hotdogs: string[] }>(cacheKey);
      
      if (cachedData) {
        return {
          users: cachedData.users,
          hotdogs: cachedData.hotdogs,
        };
      }

      const contract = getContract({
        address: LOG_A_DOG[chainId]!,
        client,
        chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
      });

      try {
        // Get total count of hotdog logs
        const totalLogs = await getHotdogLogsCount({ contract });
        
        if (totalLogs === 0n) {
          return { users: [], hotdogs: [] };
        }

        // Get all hotdog logs in batches to avoid gas limits
        const batchSize = 100;
        const allLogs: Array<{
          logId: bigint;
          imageUri: string;
          metadataUri: string;
          timestamp: bigint;
          eater: string;
          logger: string;
          zoraCoin: string;
        }> = [];

        for (let start = 0; start < Number(totalLogs); start += batchSize) {
          const limit = Math.min(batchSize, Number(totalLogs) - start);
          const logs = await getHotdogLogsRange({
            contract,
            start: BigInt(start),
            limit: BigInt(limit)
          });
          allLogs.push(...logs);
        }

        // Filter logs by date range if provided
        const filteredLogs = allLogs.filter(log => {
          const logTimestamp = Number(log.timestamp) * 1000; // Convert to milliseconds
          if (startDate && logTimestamp < startDate) return false;
          if (endDate && logTimestamp > endDate) return false;
          return true;
        });

        // Count hotdogs per user
        const userCounts = new Map<string, number>();
        
        for (const log of filteredLogs) {
          const eater = log.eater.toLowerCase();
          userCounts.set(eater, (userCounts.get(eater) ?? 0) + 1);
        }

        // Sort users by hotdog count (descending)
        const sortedUsers = Array.from(userCounts.entries())
          .sort((a, b) => b[1] - a[1])

        const result = {
          users: sortedUsers.map(([user]) => user),
          hotdogs: sortedUsers.map(([, count]) => count.toString()),
        };

        // Cache the result
        await setCachedData(cacheKey, result, CACHE_DURATION.MEDIUM);

        return result;
      } catch (error) {
        console.error("Error fetching leaderboard from contract:", error);
        throw error;
      }
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

        const isSafeForWork = safeSearchAnnotation.adult !== "VERY_LIKELY";
        const isSafeForViolence = safeSearchAnnotation.violence !== "VERY_LIKELY";
        const isSafeForMedical = safeSearchAnnotation.medical !== "VERY_LIKELY";

        return isSafeForWork && isSafeForViolence && isSafeForMedical;

      } catch (error) {
        console.error("Error posting image for safety check:", error);
        throw error;
      }
    }),
  log: protectedProcedure
    .input(z.object({
      chainId: z.number(),
      imageUri: z.string(),
      metadataUri: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log({ user: ctx.session?.user });
      const { chainId, imageUri, metadataUri, description } = input;

      if (!ctx.session?.user.address) {
        throw new Error("User address not found");
      }

      console.log({
        imageUri,
        metadataUri,
        eater: ctx.session.user.address,
      })
      const coinMetadata = {
        name: "Logged Dog",
        description: description && description.trim() !== '' ? description : "Logging dogs onchain",
        image: imageUri,
        properties: {
          category: "social",
        },
      }
      const coinMetadataUri = await upload({
        client,
        files: [coinMetadata],
      });

      const POOL_CONFIG = encodePoolConfig();

      const transaction = logHotdogOnBehalf({
        contract: getContract({
          address: LOG_A_DOG[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        imageUri,
        metadataUri,
        coinUri: coinMetadataUri,
        eater: ctx.session.user.address,
        poolConfig: POOL_CONFIG,
      });

      console.log({
        imageUri,
        metadataUri,
        coinMetadataUri,
        eater: ctx.session.user.address,
        poolConfig: POOL_CONFIG,
      })
      
      try {
        const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
  
        // Invalidate Redis cache for all hotdog queries and leaderboard for this chain
        const hotdogPattern = `hotdogs:${chainId}:*`;
        const leaderboardPattern = `leaderboard:${chainId}:*`;
        await deleteCachedData(hotdogPattern);
        await deleteCachedData(leaderboardPattern);
  
        return transactionId;
      } catch (error) {
        console.error("Error logging hotdog:", error);
        throw error;
      }
    }),
  judge: protectedProcedure
    .input(z.object({
      chainId: z.number(),
      logId: z.string(),
      isValid: z.boolean(),
      shouldRevoke: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { chainId, logId, isValid } = input;

      if (!ctx.session?.user.address) {
        throw new Error("User address not found");
      }

      const attestationContract = getContract({
        address: ATTESTATION_MANAGER[chainId]!,
        client,
        chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
      });

      const minimumStake = await MINIMUM_ATTESTATION_STAKE({ contract: attestationContract });

      const canParticipateInAttestations = await canParticipateInAttestation({
        contract: getContract({
          address: STAKING[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        user: ctx.session.user.address,
        requiredStake: minimumStake,
      });

      if (!canParticipateInAttestations) {
        throw new Error("Insufficient stake");
      }

      try {
        const transaction = attestToLogOnBehalf({
          contract: attestationContract,
          logId: BigInt(logId),
          attestor: ctx.session.user.address,
          isValid,
          stakeAmount: minimumStake,
        });

        const { transactionId } = await serverWallet.enqueueTransaction({ transaction });

        // Invalidate Redis cache for all hotdog queries and leaderboard for this chain
        const hotdogPattern = `hotdogs:${chainId}:*`;
        const leaderboardPattern = `leaderboard:${chainId}:*`;
        await deleteCachedData(hotdogPattern);
        await deleteCachedData(leaderboardPattern);

        return transactionId;
      } catch (error) {
        console.error("Error processing attestation:", error);
        throw error;
      }
    }),
});

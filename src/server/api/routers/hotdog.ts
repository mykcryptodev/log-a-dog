/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { z } from "zod";
import { AI_AFFIRMATION, ATTESTATION_MANAGER, LOG_A_DOG, MODERATION, STAKING, MAKER_WALLET } from "~/constants/addresses";
import { encode, getContract, getGasPrice, prepareTransaction } from "thirdweb";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { client, serverWallet } from "~/server/utils";
import { logHotdogOnBehalf } from "~/thirdweb/84532/0x0b04ceb7542cc13e0e483e7b05907c31dbee4d7f";
import { getRedactedLogIds } from "~/thirdweb/84532/0x22394188550a7e5b37485769f54653e3bc9c6674";
import { attestToLogOnBehalf, MINIMUM_ATTESTATION_STAKE, resolveAttestationPeriod, getAttestationPeriod } from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { env } from "~/env";
import { download } from 'thirdweb/storage';
import { getCoins } from '@zoralabs/coins-sdk';
import { getCachedData, getOrSetCache, setCachedData, CACHE_DURATION, deleteCachedData /*, invalidateCache */ } from "~/server/utils/redis";
import { CONTEST_END_TIME, CONTEST_START_TIME } from "~/constants";
import { encodePoolConfig } from "~/server/utils/poolConfig";
import { upload } from "thirdweb/storage";
import { canParticipateInAttestation } from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";
import { getUserAttestationsWithChoices } from "~/thirdweb/84532/0xfbc7552a4bc2eaa35ba5e7644b67f3f05b161a56";
import { getAttestationCounts } from "~/thirdweb/84532/0xc470f55c2877848f1acfcf3b656e01dce03e9ec3";
import { getDogEvents, getDogEventsByEater, getDogEventLeaderboard } from "~/server/api/dog-events";
import { db } from "~/server/db";
import { getUserOpGasFees } from "thirdweb/wallets/smart";
import { abi } from "~/constants/abi/logadog";

// Helper function to convert IPFS URLs to HTTPS URLs
const convertIpfsToHttps = (url: string | null | undefined): string | null => {
  if (!url) return url ?? null;
  
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  return url;
};

const redactedImage = "https://ipfs.io/ipfs/QmXZ8SpvGwRgk3bQroyM9x9dQCvd87c23gwVjiZ5FMeXGs/Image%20(1).png";

// Mapping from chain id to slug used by Zora to construct coin URLs
const ZORA_CHAIN_SLUGS: Record<number, string> = {
  8453: "base",
  84532: "base-sepolia",
};

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
  volume24h?: string;
  createdAt?: string;
  creatorAddress?: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  chainId?: number;
  uniqueHolders?: number;
  mediaContent?: {
    mimeType?: string;
    originalUri?: string;
    previewImage?: {
      small?: string;
      medium?: string;
      blurhash?: string;
    };
  };
  link?: string;
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
  attestationPeriod?: {
    startTime: string;
    endTime: string;
    status: number;
    totalValidStake: string;
    totalInvalidStake: string;
    isValid: boolean;
  };
  duplicateOfLogId?: string | null;
  eaterProfile?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
  } | null;
  loggerProfile?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
  } | null;
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
  const uncachedAddresses: string[] = [];
  
  // First, check cache for each individual coin
  for (const address of addresses) {
    const normalizedAddress = address.toLowerCase();
    const cacheKey = `zora-coin:${chainId}:${normalizedAddress}`;
    
    const cachedCoin = await getCachedData<ZoraCoinDetails>(cacheKey);
    if (cachedCoin) {
      coinDetailsMap.set(normalizedAddress, cachedCoin);
    } else {
      uncachedAddresses.push(address);
    }
  }
  
  // If all coins were cached, return early
  if (uncachedAddresses.length === 0) {
    return coinDetailsMap;
  }
  
  // Fetch uncached coins in chunks
  const chunkSize = 50;
  for (let i = 0; i < uncachedAddresses.length; i += chunkSize) {
    const chunk = uncachedAddresses.slice(i, i + chunkSize);
    
    try {
      const response = await getCoins({
        coins: chunk.map(address => ({
          collectionAddress: address as `0x${string}`,
          chainId,
        })),
      });
      
      if (response.data?.zora20Tokens) {
        // Cache each coin individually
        for (const coin of response.data.zora20Tokens) {
          if (coin?.address) {
            const normalizedAddress = coin.address.toLowerCase();

            // Prepare coin details object with adjusted values
            const slug = ZORA_CHAIN_SLUGS[coin.chainId ?? chainId];
            const processedCoin: ZoraCoinDetails = {
              ...coin,
              marketCap: coin.marketCap
                ? (Number(coin.marketCap) / 1e11).toString()
                : undefined,
              volume24h: coin.volume24h
                ? (Number(coin.volume24h) / 1e11).toString()
                : undefined,
              // Always provide a link, fallback to base chain if slug missing
              link: slug 
                ? `https://zora.co/coin/${slug}:${coin.address}` 
                : `https://zora.co/coin/base:${coin.address}`,
            };

            coinDetailsMap.set(normalizedAddress, processedCoin);

            // Cache this coin individually
            const cacheKey = `zora-coin:${chainId}:${normalizedAddress}`;
            await setCachedData(cacheKey, processedCoin, CACHE_DURATION.MEDIUM);
          } else {
            console.log('Skipping coin with no address:', coin);
          }
        }
      } else {
        console.log('No zora20Tokens in response:', response);
      }
    } catch (error) {
      console.error(`Error fetching Zora coin details for batch:`, error);
      
      // For failed API calls, create minimal coin objects with just address and link
      chunk.forEach(address => {
        if (!coinDetailsMap.has(address.toLowerCase())) {
          const normalizedAddress = address.toLowerCase();
          const fallbackCoin: ZoraCoinDetails = {
            id: address,
            name: `Coin ${address.slice(0, 6)}...`,
            description: '',
            address,
            symbol: 'COIN',
            totalSupply: '0',
            totalVolume: '0',
            chainId,
            link: `https://zora.co/coin/base:${address}`, // Always provide a link
          };
          
          coinDetailsMap.set(normalizedAddress, fallbackCoin);
          
          // Cache the fallback for shorter duration
          const cacheKey = `zora-coin:${chainId}:${normalizedAddress}`;
          setCachedData(cacheKey, fallbackCoin, CACHE_DURATION.SHORT).catch(console.error);
        }
      });
    }
  }
  
  return coinDetailsMap;
}


// Helper function to fetch attestation periods in batch
async function getAttestationPeriodsBatch(logIds: string[], chainId: number): Promise<Map<string, {
  logId: string;
  startTime: string;
  endTime: string;
  status: number;
  totalValidStake: string;
  totalInvalidStake: string;
  isValid: boolean;
}>> {
  const attestationPeriodMap = new Map<string, {
    logId: string;
    startTime: string;
    endTime: string;
    status: number;
    totalValidStake: string;
    totalInvalidStake: string;
    isValid: boolean;
  }>();
  
  // Process in chunks to avoid overwhelming the RPC
  const chunkSize = 50;
  for (let i = 0; i < logIds.length; i += chunkSize) {
    const chunk = logIds.slice(i, i + chunkSize);
    
    try {
      const attestationContract = getContract({
        address: ATTESTATION_MANAGER[chainId]!,
        client,
        chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
      });

      // Fetch attestation periods for this chunk
      const attestationPeriods = await Promise.all(
        chunk.map(async (logId) => {
          try {
            const period = await getAttestationPeriod({
              contract: attestationContract,
              logId: BigInt(logId),
            });
            return {
              logId,
              startTime: period[0].toString(),
              endTime: period[1].toString(),
              status: Number(period[2]),
              totalValidStake: period[3].toString(),
              totalInvalidStake: period[4].toString(),
              isValid: Boolean(period[5]),
            };
          } catch (error) {
            console.error(`Error fetching attestation period for log ${logId}:`, error);
            return null;
          }
        })
      );

      // Add to map
      attestationPeriods.forEach(period => {
        if (period) {
          attestationPeriodMap.set(period.logId, period);
        }
      });
    } catch (error) {
      console.error(`Error fetching attestation periods for chunk:`, error);
    }
  }
  
  return attestationPeriodMap;
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
      // const cacheKey = `hotdogs:${chainId}:${user}:${start}:${limit}`;
      
      // TEMPORARILY DISABLE REDIS CACHE for development stability
      // const cachedData = await getCachedData<GetAllResponse>(cacheKey);
      const cachedData = null;
      
      if (cachedData) {
        return cachedData;
      }

      // Get dog events from database instead of blockchain
      const contestStartTime = BigInt(new Date(CONTEST_START_TIME).getTime() / 1000);
      const contestEndTime = BigInt(new Date(CONTEST_END_TIME).getTime() / 1000);
      
      const queryParams = {
        where: {
          chainId: chainId.toString(),
          timestamp: {
            gte: contestStartTime,
            lte: contestEndTime,
          },
          ...(user !== "0x0000000000000000000000000000000000000000" && { eater: user.toLowerCase() }),
        },
        orderBy: { timestamp: "desc" as const },
        take: limit,
        skip: start,
      };
      
      let dogEvents;
      try {
        dogEvents = await getDogEvents(queryParams);
      } catch (error) {
        console.error('Database query failed:', error);
        throw error;
      }

      // Get total count for pagination
      const totalEvents = await db.dogEvent.count({
        where: {
          chainId: chainId.toString(),
          timestamp: {
            gte: contestStartTime,
            lte: contestEndTime,
          },
          ...(user !== "0x0000000000000000000000000000000000000000" && { eater: user.toLowerCase() }),
        },
      });
      const totalPages = Math.ceil(totalEvents / limit);

      const [redactedLogIds, userAttestations] = await Promise.all([
        getRedactedLogIds({
          contract: getContract({
            address: MODERATION[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
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

      // Get attestation counts and periods for each log ID
      const logIds = dogEvents.map(event => event.logId);
      const [attestationCounts, attestationPeriods] = await Promise.all([
        getAttestationCounts({
          contract: getContract({
            address: ATTESTATION_MANAGER[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          logIds: dogEvents.map(event => BigInt(event.logId)),
        }),
        getAttestationPeriodsBatch(logIds, chainId)
      ]);

      // Convert redactedLogIds from readonly bigint[] to string[]
      const redactedLogIdsStr = Array.from(redactedLogIds).map(id => id.toString());

      // Convert database events to our string-based types
      const processedResponse: HotdogResponse = {
        logs: dogEvents.map(event => ({
          logId: event.logId,
          timestamp: event.timestamp.toString(),
          imageUri: redactedLogIdsStr.includes(event.logId) ? redactedImage : event.imageUri,
          metadataUri: event.metadataUri ?? '',
          eater: event.eater,
          logger: event.logger,
          zoraCoin: event.zoraCoin ?? '',
        })),
        // Get valid/invalid counts from attestationCounts response
        validCounts: attestationCounts[0].map(count => count.toString()),
        invalidCounts: attestationCounts[1].map(count => count.toString()),
        userHasAttested: dogEvents.map(event => userAttestations[0].includes(BigInt(event.logId))),
        userAttestations: dogEvents.map(event => userAttestations[1][userAttestations[0].findIndex(id => id === BigInt(event.logId))] ?? false),
      };

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

      // Detect duplicate images
      const imageUris = Array.from(new Set(dogEvents.map(e => e.imageUri)));
      const duplicateEvents = await db.dogEvent.findMany({
        where: { imageUri: { in: imageUris } },
        orderBy: { timestamp: 'asc' },
        select: { imageUri: true, logId: true, timestamp: true },
      });
      const earliestByImage = new Map<string, { logId: string; timestamp: bigint }>();
      const countByImage = new Map<string, number>();
      for (const ev of duplicateEvents) {
        countByImage.set(ev.imageUri, (countByImage.get(ev.imageUri) ?? 0) + 1);
        const existing = earliestByImage.get(ev.imageUri);
        if (!existing || ev.timestamp < existing.timestamp) {
          earliestByImage.set(ev.imageUri, { logId: ev.logId, timestamp: ev.timestamp });
        }
      }
      const duplicateOfMap = new Map<string, string>();
      for (const ev of duplicateEvents) {
        const earliest = earliestByImage.get(ev.imageUri)!;
        if ((countByImage.get(ev.imageUri) ?? 0) > 1 && ev.logId !== earliest.logId) {
          duplicateOfMap.set(ev.logId, earliest.logId);
        }
      }

      // Collect unique eater and logger addresses for profile fetching
      const uniqueAddresses = new Set<string>();
      processedResponse.logs.forEach(log => {
        uniqueAddresses.add(log.eater.toLowerCase());
        uniqueAddresses.add(log.logger.toLowerCase());
      });
      const addressesArray = [...uniqueAddresses];

      // Fetch all Zora coin details, metadata, and profiles in parallel
      const [zoraCoinDetails, metadataResults, profiles] = await Promise.all([
        zoraCoinAddressesArray.length > 0
          ? getZoraCoinDetailsBatch(zoraCoinAddressesArray, chainId)
          : new Map<string, ZoraCoinDetails>(),
        Promise.all(metadataUrisArray.map(uri => getMetadataFromUri(uri))),
        db.user.findMany({
          where: {
            address: {
              in: addressesArray,
            },
          },
          select: {
            address: true,
            username: true,
            name: true,
            image: true,
            fid: true,
            isKnownSpammer: true,
            isReportedForSpam: true,
          },
        })
      ]); 

      // Create maps for the fetched data
      const metadataMap = new Map(
        metadataUrisArray.map((uri, index) => [uri, metadataResults[index]])
      );
      
      const profileMap = new Map(
        profiles.map(profile => [
          profile.address?.toLowerCase() ?? '',
          {
            username: profile.username,
            name: profile.name,
            image: profile.image,
            fid: profile.fid,
            isKnownSpammer: profile.isKnownSpammer,
            isReportedForSpam: profile.isReportedForSpam,
          }
        ])
      );

      // Process logs with Zora coin details, metadata, and profile data
      const processedHotdogs = processedResponse.logs.map(log => {
        const zoraCoin = zoraCoinDetails.get(log.zoraCoin.toLowerCase()) ?? null;
        const metadata = metadataMap.get(log.metadataUri.toLowerCase()) ?? null;
        const attestationPeriod = attestationPeriods.get(log.logId);
        const duplicateOfLogId = duplicateOfMap.get(log.logId) ?? null;
        const eaterProfile = profileMap.get(log.eater.toLowerCase()) ?? null;
        const loggerProfile = profileMap.get(log.logger.toLowerCase()) ?? null;

        return {
          ...log,
          zoraCoin,
          metadata,
          attestationPeriod,
          duplicateOfLogId,
          eaterProfile,
          loggerProfile,
        } as ProcessedHotdog;
      });

      const response: GetAllResponse = {
        hotdogs: processedHotdogs,
        validAttestations: processedResponse.validCounts,
        invalidAttestations: processedResponse.invalidCounts,
        userAttested: processedResponse.userHasAttested,
        userAttestations: processedResponse.userAttestations,
        totalPages: Number(totalPages),
        hasNextPage: start + limit < totalEvents,
      };

      // TEMPORARILY DISABLE CACHING during development
      // await setCachedData(cacheKey, response);

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
      // Get dog events from database for specific user
      const contestStartTime = BigInt(new Date(CONTEST_START_TIME).getTime() / 1000);
      const contestEndTime = BigInt(new Date(CONTEST_END_TIME).getTime() / 1000);
      
      const userDogEvents = await getDogEventsByEater(user.toLowerCase(), {
        take: limit,
      });

      // Filter by contest time period
      const filteredEvents = userDogEvents.filter(event => 
        event.chainId === chainId.toString() &&
        event.timestamp >= contestStartTime &&
        event.timestamp <= contestEndTime
      );

      // Get total count for pagination
      const totalEvents = await db.dogEvent.count({
        where: {
          eater: user.toLowerCase(),
          chainId: chainId.toString(),
          timestamp: {
            gte: contestStartTime,
            lte: contestEndTime,
          },
        },
      });
      const totalPages = Math.ceil(totalEvents / limit);

      const [redactedLogIds] = await Promise.all([
        getRedactedLogIds({
          contract: getContract({
            address: MODERATION[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
        }),
      ]);
      const currentPage = 1;
      const hasNextPage = currentPage < totalPages;

      const redactedLogIdsStr = Array.from(redactedLogIds).map(id => id.toString());
      const moderatedHotdogs = filteredEvents.map(event => ({
        logId: event.logId,
        timestamp: event.timestamp.toString(),
        imageUri: redactedLogIdsStr.includes(event.logId) ? redactedImage : event.imageUri,
        metadataUri: event.metadataUri ?? '',
        eater: event.eater,
        logger: event.logger,
        zoraCoin: event.zoraCoin ?? '',
      }));

      // Collect unique zoraCoin addresses, metadata URIs, and user addresses for batch fetching
      const zoraCoinAddresses = new Set<string>();
      const metadataUris = new Set<string>();
      const uniqueAddresses = new Set<string>();
      
      moderatedHotdogs.forEach(log => {
        if (log.zoraCoin) zoraCoinAddresses.add(log.zoraCoin);
        if (log.metadataUri) metadataUris.add(log.metadataUri);
        uniqueAddresses.add(log.eater.toLowerCase());
        uniqueAddresses.add(log.logger.toLowerCase());
      });
      
      const zoraCoinAddressesArray = [...zoraCoinAddresses];
      const metadataUrisArray = [...metadataUris];
      const addressesArray = [...uniqueAddresses];

      // Detect duplicate images
      const imageUris = Array.from(new Set(filteredEvents.map(e => e.imageUri)));
      const duplicateEvents = await db.dogEvent.findMany({
        where: { imageUri: { in: imageUris } },
        orderBy: { timestamp: 'asc' },
        select: { imageUri: true, logId: true, timestamp: true },
      });
      const earliestByImage = new Map<string, { logId: string; timestamp: bigint }>();
      const countByImage = new Map<string, number>();
      for (const ev of duplicateEvents) {
        countByImage.set(ev.imageUri, (countByImage.get(ev.imageUri) ?? 0) + 1);
        const existing = earliestByImage.get(ev.imageUri);
        if (!existing || ev.timestamp < existing.timestamp) {
          earliestByImage.set(ev.imageUri, { logId: ev.logId, timestamp: ev.timestamp });
        }
      }
      const duplicateOfMap = new Map<string, string>();
      for (const ev of duplicateEvents) {
        const earliest = earliestByImage.get(ev.imageUri)!;
        if ((countByImage.get(ev.imageUri) ?? 0) > 1 && ev.logId !== earliest.logId) {
          duplicateOfMap.set(ev.logId, earliest.logId);
        }
      }

      // Fetch Zora coin details, metadata, and profiles in parallel
      const [zoraCoinDetails, metadataResults, profiles] = await Promise.all([
        zoraCoinAddressesArray.length > 0
          ? getZoraCoinDetailsBatch(zoraCoinAddressesArray, chainId)
          : new Map<string, ZoraCoinDetails>(),
        Promise.all(metadataUrisArray.map(uri => getMetadataFromUri(uri))),
        db.user.findMany({
          where: {
            address: {
              in: addressesArray,
            },
          },
          select: {
            address: true,
            username: true,
            name: true,
            image: true,
            fid: true,
            isKnownSpammer: true,
            isReportedForSpam: true,
          },
        })
      ]);

      // Create maps for the fetched data
      const metadataMap = new Map(
        metadataUrisArray.map((uri, index) => [uri, metadataResults[index]])
      );
      
      const profileMap = new Map(
        profiles.map(profile => [
          profile.address?.toLowerCase() ?? '',
          {
            username: profile.username,
            name: profile.name,
            image: profile.image,
            fid: profile.fid,
            isKnownSpammer: profile.isKnownSpammer,
            isReportedForSpam: profile.isReportedForSpam,
          }
        ])
      );

      // Process logs with Zora coin details, metadata, and profile data
      const processedHotdogs = moderatedHotdogs.map(log => {
        const zoraCoin = zoraCoinDetails.get(log.zoraCoin.toLowerCase()) ?? null;
        const metadata = metadataMap.get(log.metadataUri.toLowerCase()) ?? null;
        const duplicateOfLogId = duplicateOfMap.get(log.logId) ?? null;
        const eaterProfile = profileMap.get(log.eater.toLowerCase()) ?? null;
        const loggerProfile = profileMap.get(log.logger.toLowerCase()) ?? null;

        return {
          ...log,
          zoraCoin,
          metadata,
          duplicateOfLogId,
          eaterProfile,
          loggerProfile,
        } as ProcessedHotdog;
      });

      return {
        hotdogs: processedHotdogs,
        validAttestations: processedHotdogs.map(() => "0"), // Default to 0 for each hotdog
        invalidAttestations: processedHotdogs.map(() => "0"), // Default to 0 for each hotdog
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

      // Get dog event from database by logId
      const dogEvent = await db.dogEvent.findFirst({
        where: {
          logId,
          chainId: chainId.toString(),
        },
      });

      if (!dogEvent) {
        return null;
      }

      // Find duplicate image logs
      const duplicates = await db.dogEvent.findMany({
        where: { imageUri: dogEvent.imageUri },
        orderBy: { timestamp: 'asc' },
        select: { logId: true, timestamp: true },
      });
      const duplicateOfLogId =
        duplicates.length > 1 && duplicates[0]?.logId !== dogEvent.logId
          ? duplicates[0]?.logId
          : null;

      const [redactedLogIds, attestationCounts, userAttestations, attestationPeriods] = await Promise.all([
        getRedactedLogIds({
          contract: getContract({
            address: MODERATION[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
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
        getAttestationPeriodsBatch([logId], chainId)
      ]);

      const redactedLogIdsStr = Array.from(redactedLogIds).map(id => id.toString());
      const processedResponse: HotdogResponse = {
        logs: [
          {
            logId: dogEvent.logId,
            timestamp: dogEvent.timestamp.toString(),
            imageUri: redactedLogIdsStr.includes(dogEvent.logId) ? redactedImage : dogEvent.imageUri,
            metadataUri: dogEvent.metadataUri ?? '',
            eater: dogEvent.eater,
            logger: dogEvent.logger,
            zoraCoin: dogEvent.zoraCoin ?? '',
          },
        ],
        validCounts: [attestationCounts[0]?.[0]?.toString() ?? '0'],
        invalidCounts: [attestationCounts[1]?.[0]?.toString() ?? '0'],
        userHasAttested: [userAttestations[0].includes(BigInt(dogEvent.logId))],
        userAttestations: [userAttestations[1][userAttestations[0].findIndex(id => id === BigInt(dogEvent.logId))] ?? false],
      };

      const zoraCoinAddressesArray = processedResponse.logs[0]?.zoraCoin ? [processedResponse.logs[0].zoraCoin] : [];
      
      // Collect unique eater and logger addresses for profile fetching
      const uniqueAddresses = [dogEvent.eater.toLowerCase(), dogEvent.logger.toLowerCase()];
      
      const [zoraCoinDetails, metadata, profiles] = await Promise.all([
        zoraCoinAddressesArray.length > 0 ? getZoraCoinDetailsBatch(zoraCoinAddressesArray, chainId) : new Map<string, ZoraCoinDetails>(),
        getMetadataFromUri(processedResponse.logs[0]?.metadataUri ?? ''),
        db.user.findMany({
          where: {
            address: {
              in: uniqueAddresses,
            },
          },
          select: {
            address: true,
            username: true,
            name: true,
            image: true,
            fid: true,
            isKnownSpammer: true,
            isReportedForSpam: true,
          },
        })
      ]);

      // Create profile map for lookup
      const profileMap = new Map(
        profiles.map(profile => [
          profile.address?.toLowerCase() ?? '',
          {
            username: profile.username,
            name: profile.name,
            image: convertIpfsToHttps(profile.image),
            fid: profile.fid,
            isKnownSpammer: profile.isKnownSpammer,
            isReportedForSpam: profile.isReportedForSpam,
          }
        ])
      );

      const processedHotdog: ProcessedHotdog = {
        ...processedResponse.logs[0]!,
        zoraCoin: processedResponse.logs[0]?.zoraCoin ? zoraCoinDetails.get(processedResponse.logs[0].zoraCoin.toLowerCase()) ?? null : null,
        metadata,
        attestationPeriod: attestationPeriods.get(logId),
        duplicateOfLogId,
        eaterProfile: profileMap.get(dogEvent.eater.toLowerCase()) ?? null,
        loggerProfile: profileMap.get(dogEvent.logger.toLowerCase()) ?? null,
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
      // Get dog event from database
      const dogEvent = await db.dogEvent.findFirst({
        where: {
          logId,
          chainId: chainId.toString(),
          timestamp: BigInt(timestamp),
        },
      });

      if (!dogEvent) {
        throw new Error("Hotdog log not found");
      }

      // Get AI attestation status from blockchain
      const userAttestations = await getUserAttestationsWithChoices({
        contract: getContract({
          address: ATTESTATION_MANAGER[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        }),
        user: AI_AFFIRMATION[chainId]!,
      });

      const aiHasAttested = userAttestations[0].includes(BigInt(logId));

      if (!aiHasAttested) {
        return "NOT_ATTESTED";
      }

      const aiAttestation = userAttestations[1][userAttestations[0].findIndex(id => id === BigInt(logId))];

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
      const cachedData = await getCachedData<{ 
        users: string[], 
        hotdogs: string[],
        profiles: Array<{
          address: string;
          name?: string | null;
          username?: string | null; 
          image?: string | null;
          fid?: number | null;
          isKnownSpammer?: boolean | null;
          isReportedForSpam?: boolean | null;
        }>
      }>(cacheKey);

      if (cachedData) {
        return {
          users: cachedData.users,
          hotdogs: cachedData.hotdogs,
          profiles: cachedData.profiles,
        };
      }

      try {
        const leaderboard = await getDogEventLeaderboard({
          startDate,
          endDate,
        });

        const result = {
          users: leaderboard.map(l => l.eater.toLowerCase()),
          hotdogs: leaderboard.map(l => l.count.toString()),
          profiles: leaderboard.map(l => ({
            address: l.eater.toLowerCase(),
            name: l.name,
            username: l.username,
            image: convertIpfsToHttps(l.image),
            fid: l.fid,
            isKnownSpammer: l.isKnownSpammer,
            isReportedForSpam: l.isReportedForSpam,
          })),
        };

        await setCachedData(cacheKey, result, CACHE_DURATION.MEDIUM);

        return result;
      } catch (error) {
        console.error("Error fetching leaderboard from DB:", error);
        throw error;
      }
    }),
  invalidateZoraCoinCache: publicProcedure
    .input(z.object({
      chainId: z.number(),
      coinAddress: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { chainId, coinAddress } = input;
      const normalizedAddress = coinAddress.toLowerCase();
      const cacheKey = `zora-coin:${chainId}:${normalizedAddress}`;
      
      try {
        await deleteCachedData(cacheKey);
        console.log(`Invalidated cache for Zora coin: ${coinAddress} on chain ${chainId}`);
        return { success: true };
      } catch (error) {
        console.error(`Failed to invalidate cache for Zora coin: ${coinAddress}`, error);
        return { success: false, error: String(error) };
      }
    }),
  checkForSafety: protectedProcedure
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
      const { chainId, imageUri, metadataUri, description } = input;

      if (!ctx.session?.user.address) {
        throw new Error("User address not found");
      }

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

      // Prepare base transaction
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

      // get the gas price
      const gasPrice = await getUserOpGasFees({
        options: {
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          client,
        },
      });
      const maxFeePerGas = gasPrice.maxFeePerGas.toString();
      const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas.toString();
      const estimatedGas = await serverWallet.estimateGas?.(transaction);

      // const preparedTransaction = prepareTransaction({
      //   to: LOG_A_DOG[chainId]!,
      //   data,
      //   chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
      //   client,
      //   gas: BigInt(5000000), // 5M gas limit
      //   maxFeePerGas,
      //   maxPriorityFeePerGas,
      // });

      console.log({
        imageUri,
        metadataUri,
        coinMetadataUri,
        eater: ctx.session.user.address,
        poolConfig: POOL_CONFIG,
      })
      
      try {
        // const { transactionId } = await serverWallet.enqueueTransaction({ transaction: preparedTransaction });
        const headers = {
          // Authorization: `Bearer ${env.THIRDWEB_ENGINE_API_KEY}`,
          Authorization: `Bearer ${env.THIRDWEB_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'X-Backend-Wallet-Address': MAKER_WALLET,
        }
        const body = {
          functionName: 'logHotdogOnBehalf',
          args: [
            imageUri,
            metadataUri,
            coinMetadataUri,
            ctx.session.user.address,
            POOL_CONFIG,
          ],
          abi,
          txOverrides: {
            gas: "5000000", // 5M gas limit (realistic for this transaction)
            maxFeePerGas: (BigInt(maxFeePerGas) * 2n).toString(), // 100 gwei (reasonable for Base)
            maxPriorityFeePerGas: (BigInt(maxPriorityFeePerGas) * 2n).toString(), // 100 gwei (lower priority fee)
            timeoutSeconds: 10,
          }
        }
        const req = await fetch(`${env.THIRDWEB_ENGINE_URL}/contract/${chainId}/${LOG_A_DOG[chainId]}/write`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        const res = await req.json() as { result: { queueId: string } };
        const transactionId = res.result.queueId;
  
        // Invalidate Redis cache for all hotdog queries and leaderboard for this chain
        const hotdogPattern = `hotdogs:${chainId}:*`;
        const leaderboardPattern = `leaderboard:${chainId}:*`;
        await deleteCachedData(hotdogPattern);
        await deleteCachedData(leaderboardPattern);
  
        // Return data needed for optimistic updates
        return {
          transactionId,
          optimisticData: {
            logId: transactionId, // Use transactionId as temporary logId
            imageUri,
            metadataUri,
            eater: ctx.session.user.address,
            logger: ctx.session.user.address,
            zoraCoin: '', // Will be populated later
            timestamp: Math.floor(Date.now() / 1000).toString(),
            chainId: chainId.toString(),
            isPending: true as const,
          }
        };
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
  rewardModerators: protectedProcedure
    .input(z.object({
      chainId: z.number(),
      logId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { chainId, logId } = input;

      try {
        const transaction = resolveAttestationPeriod({
          contract: getContract({
            address: ATTESTATION_MANAGER[chainId]!,
            client,
            chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
          }),
          logId: BigInt(logId),
        });

        const { transactionId } = await serverWallet.enqueueTransaction({ transaction });

        // Invalidate Redis cache for all hotdog queries and leaderboard for this chain
        const hotdogPattern = `hotdogs:${chainId}:*`;
        const leaderboardPattern = `leaderboard:${chainId}:*`;
        await deleteCachedData(hotdogPattern);
        await deleteCachedData(leaderboardPattern);

        return transactionId;
      } catch (error) {
        console.error("Error resolving attestation period:", error);
        throw error;
      }
    }),
  getDogEventByTransactionHash: publicProcedure
    .input(z.object({
      transactionHash: z.string(),
    }))
    .query(async ({ input }) => {
      const { transactionHash } = input;
      const { getDogEventByTransactionHash } = await import("~/server/api/dog-events");
      
      const dogEvent = await getDogEventByTransactionHash(transactionHash);
      
      if (!dogEvent) {
        return null;
      }
      
      return {
        logId: dogEvent.logId,
        imageUri: dogEvent.imageUri,
        eater: dogEvent.eater,
      };
    }),
});

import { Redis } from '@upstash/redis';
import { env } from "~/env";

// Create Redis client
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache duration in seconds
export const CACHE_DURATION = {
  SHORT: 60, // 1 minute - for rapidly changing data (staking APY)
  MEDIUM: 900, // 15 minutes - for user profiles and search results
  LONG: 1800, // 30 minutes - for leaderboards and aggregated data
  VERY_LONG: 3600, // 1 hour - for IPFS metadata and static content
  EXTRA_LONG: 86400, // 24 hours - for permanent or rarely changing data
} as const;

// Helper function to get cached data
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

// Helper function to set cached data
export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = CACHE_DURATION.MEDIUM
): Promise<void> {
  try {
    await redis.set(key, data, { ex: ttl });
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
}

// Helper function to invalidate cache
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

// Helper function to get or set cached data
export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_DURATION.MEDIUM
): Promise<T> {
  // Try to get cached data
  const cachedData = await getCachedData<T>(key);
  if (cachedData) {
    return cachedData;
  }

  // If no cached data, fetch and cache it
  const data = await fetchFn();
  await setCachedData(key, data, ttl);
  return data;
}

// Helper function to delete cached data by pattern
export async function deleteCachedData(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Error deleting cached data:', error);
  }
}

// Helper function to warm cache with data
export async function warmCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_DURATION.MEDIUM
): Promise<void> {
  try {
    const data = await fetchFn();
    await setCachedData(key, data, ttl);
  } catch (error) {
    console.error('Error warming cache:', error);
  }
}

// Helper function to get cache metrics (for monitoring)
export async function getCacheInfo(key: string): Promise<{ exists: boolean; ttl: number | null }> {
  try {
    const exists = await redis.exists(key);
    const ttl = exists ? await redis.ttl(key) : null;
    return { exists: exists === 1, ttl };
  } catch (error) {
    console.error('Error getting cache info:', error);
    return { exists: false, ttl: null };
  }
}
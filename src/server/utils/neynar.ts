import { env } from "~/env";
import { getOrSetCache, CACHE_DURATION } from "./redis";

export type NeynarUser = {
  username: string;
  verified_addresses: {
    eth_addresses: string[];
  };
};

export type NeynarResponse = Record<string, NeynarUser[]>;

const CHUNK_SIZE = 10;

/**
 * Fetches Neynar profiles for a list of addresses with caching
 * @param addresses List of addresses to fetch profiles for
 * @returns Map of address to Neynar user profile
 */
export async function getNeynarProfiles(addresses: string[]): Promise<Map<string, NeynarUser>> {
  const result = new Map<string, NeynarUser>();
  
  // Process addresses in chunks to avoid hitting rate limits
  for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
    const chunk = addresses.slice(i, i + CHUNK_SIZE);
    const chunkKey = `neynar:${chunk.join(',')}`;
    
    const chunkResult = await getOrSetCache(
      chunkKey,
      async () => {
        try {
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${chunk.join(',')}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'api_key': env.NEYNAR_API_KEY,
              },
            }
          );

          if (!response.ok) {
            console.error('Error fetching Neynar profiles:', response.statusText);
            return new Map<string, NeynarUser>();
          }

          const data = await response.json() as NeynarResponse;
          return new Map(
            Object.entries(data).map(([address, users]) => [
              address,
              users[0] // Take the first user if multiple exist
            ])
          );
        } catch (error) {
          console.error('Error fetching Neynar profiles:', error);
          return new Map<string, NeynarUser>();
        }
      },
      CACHE_DURATION.MEDIUM
    );

    // Ensure chunkResult is a Map
    if (chunkResult instanceof Map) {
      chunkResult.forEach((user, address) => {
        if (user) {
          result.set(address, user);
        }
      });
    } else {
      console.error('Invalid chunk result type:', typeof chunkResult);
    }
  }

  return result;
}

/**
 * Gets a single Neynar profile for an address
 * @param address Address to fetch profile for
 * @returns Neynar user profile or null if not found
 */
export async function getNeynarProfile(address: string): Promise<NeynarUser | null> {
  const profiles = await getNeynarProfiles([address]);
  return profiles.get(address) ?? null;
} 
import { getProfile as getZoraProfile } from '@zoralabs/coins-sdk';
import { neynarClient } from '~/lib/neynar';
import { db } from '~/server/db';
import { getOrSetCache, CACHE_DURATION } from '~/server/utils/redis';

export interface UserProfile {
  username: string;
  imgUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  address: string;
}

async function getZoraProfileData(addressOrUsername: string): Promise<UserProfile | null> {
  try {
    const response = await getZoraProfile({
      identifier: addressOrUsername,
    });
    
    if (response?.data?.profile) {
      const profile = response.data.profile;
      const zoraAddresses = [
        profile.publicWallet.walletAddress,
        ...profile.linkedWallets.edges.map(w => w.node.walletAddress),
      ];
      // the user's zora addresses must match the address we were given.
      if (zoraAddresses.includes(addressOrUsername)) {
        return {
          username: profile.displayName ?? profile.handle ?? '',
          imgUrl: profile.avatar?.medium ?? '',
          metadata: profile,
          address: profile.publicWallet.walletAddress,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching Zora profile:', error);
    return null;
  }
}

export async function getProfile(addressOrUsername: string): Promise<UserProfile> {
  // Always prefer external profiles (Zora or Neynar) over custom data

  // Attempt to fetch Zora profile first
  const zoraProfile = await getZoraProfileData(addressOrUsername);
  if (zoraProfile) {
    return zoraProfile;
  }

  // Next try to fetch from Neynar
  try {
    const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
      addresses: [addressOrUsername],
    });

    const addressKey = addressOrUsername.toLowerCase();
    const user = response[addressKey]?.[0];

    if (user) {
      return {
        username: user.display_name ?? user.username,
        imgUrl: user.pfp_url ?? '',
        metadata: '',
        address: addressOrUsername,
      };
    }
  } catch (error) {
    console.error("Error fetching from Neynar:", error);
  }

  // Fall back to custom profile stored in our database
  const dbUser = await db.user.findFirst({
    where: {
      address: addressOrUsername.toLowerCase(),
    },
    select: {
      username: true,
      image: true,
      name: true,
      fid: true,
    },
  });

  if (dbUser?.username && dbUser?.image) {
    return {
      username: dbUser.username,
      imgUrl: dbUser.image,
      metadata: '',
      address: addressOrUsername,
    };
  }

  return {
    username: '',
    imgUrl: '',
    metadata: '',
    address: addressOrUsername,
  };
}

export async function getCachedProfile(address: string, chainId?: number): Promise<UserProfile> {
  const cacheKey = chainId ? `profile:${chainId}:${address.toLowerCase()}` : `profile:${address.toLowerCase()}`;
  return getOrSetCache(
    cacheKey,
    async () => {
      return await getProfile(address.toLowerCase());
    },
    CACHE_DURATION.MEDIUM
  );
}

export async function fetchUserProfiles(addresses: string[], chainId?: number): Promise<Map<string, UserProfile>> {
  const profileMap = new Map<string, UserProfile>();
  
  // Fetch profiles with caching
  const profiles = await Promise.all(
    addresses.map(async (address) => {
      const normalizedAddress = address.toLowerCase();
      const profile = await getCachedProfile(normalizedAddress, chainId);
      return { address: normalizedAddress, profile };
    })
  );

  // Create map from results
  profiles.forEach(({ address, profile }) => {
    profileMap.set(address, profile);
  });

  return profileMap;
}

export interface HotdogProfile {
  name?: string | null;
  username?: string | null;
  image?: string | null;
  fid?: number | null;
  isKnownSpammer?: boolean | null;
  isReportedForSpam?: boolean | null;
  isDisqualified?: boolean | null;
}

/** DB spam/fid fields merged with Zora/Neynar display names for feed cards. */
export async function buildHotdogProfileMap(
  addresses: string[],
  chainId?: number,
): Promise<Map<string, HotdogProfile>> {
  const uniqueAddresses = [...new Set(addresses.map((a) => a.toLowerCase()))];
  if (uniqueAddresses.length === 0) {
    return new Map();
  }

  const [dbUsers, externalProfiles] = await Promise.all([
    db.user.findMany({
      where: { address: { in: uniqueAddresses } },
      select: {
        address: true,
        username: true,
        name: true,
        image: true,
        fid: true,
        isKnownSpammer: true,
        isReportedForSpam: true,
        isDisqualified: true,
      },
    }),
    fetchUserProfiles(uniqueAddresses, chainId),
  ]);

  const dbUserMap = new Map(
    dbUsers.map((u) => [u.address?.toLowerCase() ?? "", u]),
  );

  const profileMap = new Map<string, HotdogProfile>();

  for (const address of uniqueAddresses) {
    const dbUser = dbUserMap.get(address);
    const external = externalProfiles.get(address);
    const externalName =
      external?.username && external.username.length > 0
        ? external.username
        : null;
    const externalImage =
      external?.imgUrl && external.imgUrl.length > 0 ? external.imgUrl : null;
    const displayName =
      externalName ?? dbUser?.name ?? dbUser?.username ?? null;

    profileMap.set(address, {
      username: externalName ?? dbUser?.username ?? null,
      name: displayName,
      image: externalImage ?? dbUser?.image ?? null,
      fid: dbUser?.fid ?? null,
      isKnownSpammer: dbUser?.isKnownSpammer ?? null,
      isReportedForSpam: dbUser?.isReportedForSpam ?? null,
      isDisqualified: dbUser?.isDisqualified ?? null,
    });
  }

  return profileMap;
} 
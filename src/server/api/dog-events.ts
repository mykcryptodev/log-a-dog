import { db } from "~/server/db";
import type { Prisma } from "@prisma/client";

export async function getDogEvents(options?: {
  where?: Prisma.DogEventWhereInput;
  orderBy?: Prisma.DogEventOrderByWithRelationInput;
  take?: number;
  skip?: number;
}) {
  return db.dogEvent.findMany({
    where: options?.where,
    orderBy: options?.orderBy ?? { createdAt: "desc" },
    take: options?.take,
    skip: options?.skip,
  });
}

export async function getDogEventByTransactionHash(transactionHash: string) {
  return db.dogEvent.findUnique({
    where: { transactionHash },
  });
}

export async function getDogEventsByLogger(logger: string, options?: {
  take?: number;
  skip?: number;
}) {
  return db.dogEvent.findMany({
    where: { logger },
    orderBy: { createdAt: "desc" },
    take: options?.take,
    skip: options?.skip,
  });
}

export async function getDogEventsByEater(eater: string, options?: {
  take?: number;
  skip?: number;
}) {
  return db.dogEvent.findMany({
    where: { eater },
    orderBy: { createdAt: "desc" },
    take: options?.take,
    skip: options?.skip,
  });
}

export async function getDogEventStats() {
  const [totalEvents, uniqueLoggers, uniqueEaters, attestationStats] = await Promise.all([
    db.dogEvent.count(),
    db.dogEvent.findMany({
      distinct: ["logger"],
      select: { logger: true },
    }),
    db.dogEvent.findMany({
      distinct: ["eater"],
      select: { eater: true },
    }),
    db.dogEvent.groupBy({
      by: ["attestationValid"],
      _count: true,
    }),
  ]);

  const validCount = attestationStats.find(s => s.attestationValid === true)?._count ?? 0;
  const invalidCount = attestationStats.find(s => s.attestationValid === false)?._count ?? 0;
  const pendingCount = attestationStats.find(s => s.attestationValid === null)?._count ?? 0;

  return {
    totalEvents,
    uniqueLoggers: uniqueLoggers.length,
    uniqueEaters: uniqueEaters.length,
    attestationStats: {
      valid: validCount,
      invalid: invalidCount,
      pending: pendingCount,
    },
  };
}

export async function getDogEventsByAttestationStatus(isValid: boolean | null, options?: {
  take?: number;
  skip?: number;
}) {
  return db.dogEvent.findMany({
    where: {
      attestationValid: isValid,
      attestationResolved: isValid === null ? false : true,
    },
    orderBy: { createdAt: "desc" },
    take: options?.take,
    skip: options?.skip,
  });
}

export async function getDogEventLeaderboard(options?: {
  startDate?: number;
  endDate?: number;
  take?: number;
  skip?: number;
}) {
  const where: Prisma.DogEventWhereInput = {};

  if (options?.startDate != null || options?.endDate != null) {
    where.timestamp = {} as Prisma.BigIntFilter;
    if (options?.startDate != null) {
      (where.timestamp as Prisma.BigIntFilter).gte = BigInt(options.startDate);
    }
    if (options?.endDate != null) {
      (where.timestamp as Prisma.BigIntFilter).lte = BigInt(options.endDate);
    }
  }

  // Only include events with a valid attestation
  where.attestationValid = true;

  // Get all dog events with the filters
  const dogEvents = await db.dogEvent.findMany({
    where,
    select: {
      eater: true,
    },
  });

  // Get unique eater addresses
  const uniqueEaters = [...new Set(dogEvents.map((e: { eater: string }) => e.eater.toLowerCase()))];

  // Fetch users with FIDs and profile data for these addresses
  const users = await db.user.findMany({
    where: {
      address: {
        in: uniqueEaters,
      },
    },
    select: {
      address: true,
      fid: true,
      username: true,
      name: true,
      image: true,
    },
  });

  // Create a map of address to user data and FID
  const addressToFid = new Map<string, number>();
  const addressToUser = new Map<string, { username?: string | null; name?: string | null; image?: string | null; fid?: number | null }>();
  const fidToAddresses = new Map<number, Set<string>>();
  
  users.forEach((user: { address: string | null; fid: number | null; username?: string | null; name?: string | null; image?: string | null }) => {
    if (user.address) {
      const addressLower = user.address.toLowerCase();
      addressToUser.set(addressLower, {
        username: user.username,
        name: user.name,
        image: user.image,
        fid: user.fid,
      });
      
      if (user.fid) {
        addressToFid.set(addressLower, user.fid);
        if (!fidToAddresses.has(user.fid)) {
          fidToAddresses.set(user.fid, new Set());
        }
        fidToAddresses.get(user.fid)!.add(addressLower);
      }
    }
  });

  // Group events by FID (or address if no FID)
  const groupedCounts = new Map<string, { count: number; addresses: string[]; fid?: number; userData?: { username?: string | null; name?: string | null; image?: string | null; fid?: number | null } }>();

  dogEvents.forEach((event: { eater: string }) => {
    const eaterLower = event.eater.toLowerCase();
    const fid = addressToFid.get(eaterLower);
    const userData = addressToUser.get(eaterLower);
    
    if (fid) {
      // Group by FID
      const key = `fid:${fid}`;
      if (!groupedCounts.has(key)) {
        groupedCounts.set(key, { 
          count: 0, 
          addresses: Array.from(fidToAddresses.get(fid) ?? []),
          fid,
          userData
        });
      }
      groupedCounts.get(key)!.count++;
    } else {
      // No FID, group by address
      const key = `addr:${eaterLower}`;
      if (!groupedCounts.has(key)) {
        groupedCounts.set(key, { count: 0, addresses: [eaterLower], userData });
      }
      groupedCounts.get(key)!.count++;
    }
  });

  // Convert to array and sort by count
  const leaderboard = Array.from(groupedCounts.entries())
    .map(([_key, data]) => ({
      // Use the first address associated with the FID (or the single address if no FID)
      eater: data.addresses[0] ?? '',
      count: data.count,
      fid: data.fid,
      addresses: data.addresses,
      name: data.userData?.name,
      username: data.userData?.username,
      image: data.userData?.image,
    }))
    .sort((a, b) => b.count - a.count);

  // Apply pagination
  const paginatedLeaderboard = leaderboard.slice(
    options?.skip ?? 0,
    (options?.skip ?? 0) + (options?.take ?? leaderboard.length)
  );

  return paginatedLeaderboard;
}

export async function getUserValidDogEventCount(address: string) {
  const lowerAddress = address.toLowerCase();

  // Look up the user by address to get fid and id
  const user = await db.user.findFirst({
    where: { address: lowerAddress },
    select: { id: true, fid: true },
  });

  if (user?.fid) {
    // Find all user IDs that share this fid
    const usersWithFid = await db.user.findMany({
      where: { fid: user.fid },
      select: { id: true },
    });
    const userIds = usersWithFid.map(u => u.id);

    return db.dogEvent.count({
      where: {
        userId: { in: userIds },
        attestationValid: true,
      },
    });
  }

  if (user?.id) {
    // Count by userId if we found the user but no fid
    return db.dogEvent.count({
      where: { userId: user.id, attestationValid: true },
    });
  }

  // Fallback: count by address directly
  return db.dogEvent.count({
    where: { eater: lowerAddress, attestationValid: true },
  });
}

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

  // Optimized single query approach - get dog events with user data in one query
  const dogEventsWithUsers = await db.dogEvent.findMany({
    where,
    select: {
      eater: true,
      user: {
        select: {
          fid: true,
          address: true,
        },
      },
    },
  });

  // Group events by FID (or address if no FID) in a single pass
  const groupedCounts = new Map<string, { count: number; addresses: Set<string>; fid?: number }>();

  dogEventsWithUsers.forEach((event) => {
    const eaterLower = event.eater.toLowerCase();
    const userFid = event.user?.fid;
    
    if (userFid) {
      // Group by FID
      const key = `fid:${userFid}`;
      if (!groupedCounts.has(key)) {
        groupedCounts.set(key, { 
          count: 0, 
          addresses: new Set(),
          fid: userFid 
        });
      }
      const group = groupedCounts.get(key)!;
      group.count++;
      group.addresses.add(eaterLower);
    } else {
      // No FID, group by address
      const key = `addr:${eaterLower}`;
      if (!groupedCounts.has(key)) {
        groupedCounts.set(key, { count: 0, addresses: new Set([eaterLower]) });
      }
      groupedCounts.get(key)!.count++;
    }
  });

  // Convert to array and sort by count
  const leaderboard = Array.from(groupedCounts.entries())
    .map(([_key, data]) => ({
      // Use the first address associated with the FID (or the single address if no FID)
      eater: Array.from(data.addresses)[0] ?? '',
      count: data.count,
      fid: data.fid,
      addresses: Array.from(data.addresses),
    }))
    .sort((a, b) => b.count - a.count);

  // Apply pagination
  const paginatedLeaderboard = leaderboard.slice(
    options?.skip ?? 0,
    (options?.skip ?? 0) + (options?.take ?? leaderboard.length)
  );

  return paginatedLeaderboard;
}

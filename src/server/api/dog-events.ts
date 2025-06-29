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

  if (options?.startDate || options?.endDate) {
    where.timestamp = {} as Prisma.BigIntFilter;
    if (options.startDate) {
      (where.timestamp as Prisma.BigIntFilter).gte = BigInt(options.startDate);
    }
    if (options.endDate) {
      (where.timestamp as Prisma.BigIntFilter).lte = BigInt(options.endDate);
    }
  }

  const grouped = await db.dogEvent.groupBy({
    by: ["eater"],
    where,
    _count: { eater: true },
    orderBy: { _count: { eater: "desc" } },
    take: options?.take,
    skip: options?.skip,
  });

  return grouped.map(g => ({
    eater: g.eater,
    count: g._count.eater,
  }));
}

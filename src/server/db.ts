import { PrismaClient } from "@prisma/client";
import { env } from "~/env";

const createPrismaClient = () => {
  const client = new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

  // Warm up the connection pool on client creation
  if (env.NODE_ENV === "production") {
    client.$connect().catch((error) => {
      console.error("Failed to warm up Prisma connection:", error);
    });
  }

  // Add graceful shutdown handling
  if (typeof window === 'undefined') {
    process.on('beforeExit', async () => {
      await client.$disconnect();
    });
  }

  return client;
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

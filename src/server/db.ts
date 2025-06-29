import { PrismaClient } from "@prisma/client";
import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    errorFormat: "minimal",
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Test connection on startup in production
if (env.NODE_ENV === "production") {
  db.$connect().catch((error) => {
    console.error('Failed to connect to database on startup:', error);
  });
}

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

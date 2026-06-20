/**
 * Backfill DogEvent.userId where null by matching logger address to User.address.
 *
 * Run with:
 *   bun run script:backfill-dog-event-users
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const db = new PrismaClient();

async function main() {
  const before = await db.dogEvent.count({ where: { userId: null } });
  console.log(`DogEvents with null userId before: ${before}`);

  const result = await db.$executeRaw`
    UPDATE "DogEvent" d
    SET "userId" = u.id
    FROM "User" u
    WHERE d."userId" IS NULL
      AND u.address IS NOT NULL
      AND LOWER(d.logger) = LOWER(u.address)
  `;

  console.log(`Rows updated: ${result}`);

  const after = await db.dogEvent.count({ where: { userId: null } });
  console.log(`DogEvents with null userId after: ${after}`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  void db.$disconnect();
  process.exit(1);
});

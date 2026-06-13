/**
 * Backfill the DogEvent table from on-chain `HotdogLogged` events using the
 * Coinbase CDP SQL API (https://docs.cdp.coinbase.com/data/sql-api/welcome).
 *
 * This reconstructs the data that the production `/api/webhook/dog-events`
 * handler would have written, for a freshly-created database.
 *
 * Usage: bunx tsx scripts/backfill-dog-events.ts
 */
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load .env (Prisma reads DATABASE_URL from process.env)
loadEnv();

const CDP_TOKEN = process.env.CDP_CLIENT_TOKEN;
if (!CDP_TOKEN) {
  throw new Error(
    "Set CDP_CLIENT_TOKEN (Coinbase CDP client API key) in the environment to run this script.",
  );
}
const SQL_URL = "https://api.cdp.coinbase.com/platform/v2/data/query/run";

// LogADog on Base mainnet
const LOG_A_DOG = "0x6cfb88c8d0d7ffc563155e13c62b4fa17bc25974";
const CHAIN_ID = "8453";

interface EventRow {
  block_number: string;
  block_timestamp: string; // ISO 8601
  transaction_hash: string;
  log_index: number;
  parameters: {
    eater: string;
    logger: string;
    logId: string;
    imageUri: string;
    metadataUri: string;
    timestamp: string;
    zoraCoin: string;
  };
}

async function runQuery(sql: string): Promise<EventRow[]> {
  const res = await fetch(SQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CDP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    throw new Error(`SQL API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { result: EventRow[] };
  return json.result;
}

async function main() {
  const prisma = new PrismaClient();
  const pageSize = 1000;
  let offset = 0;
  let total = 0;
  let inserted = 0;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const sql = `SELECT block_number, block_timestamp, transaction_hash, log_index, parameters
        FROM base.events
        WHERE address = '${LOG_A_DOG}' AND event_name = 'HotdogLogged'
        ORDER BY block_number ASC, log_index ASC
        LIMIT ${pageSize} OFFSET ${offset}`;
      const rows = await runQuery(sql);
      if (rows.length === 0) break;
      total += rows.length;

      const data = rows.map((r) => {
        const blockUnix = Math.floor(
          new Date(r.block_timestamp).getTime() / 1000,
        );
        return {
          chainId: CHAIN_ID,
          transactionHash: r.transaction_hash,
          address: LOG_A_DOG,
          blockTimestamp: BigInt(blockUnix),
          logId: r.parameters.logId,
          logger: r.parameters.logger.toLowerCase(),
          eater: r.parameters.eater.toLowerCase(),
          imageUri: r.parameters.imageUri,
          metadataUri: r.parameters.metadataUri || "",
          timestamp: BigInt(r.parameters.timestamp),
          zoraCoin: r.parameters.zoraCoin,
          webhookId: `backfill-${r.transaction_hash}-${r.log_index}`,
        };
      });

      const result = await prisma.dogEvent.createMany({
        data,
        skipDuplicates: true,
      });
      inserted += result.count;
      console.log(
        `  page offset=${offset}: fetched ${rows.length}, inserted ${result.count} (running total inserted: ${inserted})`,
      );

      if (rows.length < pageSize) break;
      offset += pageSize;
    }

    console.log(
      `\nDone. Fetched ${total} HotdogLogged events, inserted ${inserted} new DogEvent rows.`,
    );
    const count = await prisma.dogEvent.count();
    console.log(`DogEvent table now has ${count} rows.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

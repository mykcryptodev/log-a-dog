/**
 * Backfill attestation-resolution data onto DogEvent rows from on-chain
 * `AttestationPeriodResolved` events (AttestationManager on Base mainnet),
 * via the Coinbase CDP SQL API.
 *
 * Mirrors what /api/webhook/attestation-resolved writes.
 *
 * Usage: bunx tsx scripts/backfill-attestations.ts
 */
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv();

const CDP_TOKEN = process.env.CDP_CLIENT_TOKEN;
if (!CDP_TOKEN) {
  throw new Error(
    "Set CDP_CLIENT_TOKEN (Coinbase CDP client API key) in the environment to run this script.",
  );
}
const SQL_URL = "https://api.cdp.coinbase.com/platform/v2/data/query/run";
const ATTESTATION_MANAGER = "0xcbf054aa8feb4fd0484e45b766b502bc045076b8";
const CHAIN_ID = "8453";

interface Row {
  block_timestamp: string;
  transaction_hash: string;
  parameters: {
    logId: string;
    isValid: boolean;
    totalValidStake: string;
    totalInvalidStake: string;
  };
}

async function runQuery(sql: string): Promise<Row[]> {
  const res = await fetch(SQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CDP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) throw new Error(`SQL API ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { result: Row[] }).result;
}

async function main() {
  const prisma = new PrismaClient();
  const pageSize = 1000;
  let offset = 0;
  const rows: Row[] = [];
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await runQuery(
        `SELECT block_timestamp, transaction_hash, parameters
         FROM base.events
         WHERE address = '${ATTESTATION_MANAGER}' AND event_name = 'AttestationPeriodResolved'
         ORDER BY block_number ASC LIMIT ${pageSize} OFFSET ${offset}`,
      );
      rows.push(...page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }
    console.log(`Fetched ${rows.length} AttestationPeriodResolved events.`);

    let updated = 0;
    let missing = 0;
    // Process in small concurrent batches over the pooled connection.
    const batchSize = 25;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((r) =>
          prisma.dogEvent.updateMany({
            where: { logId: r.parameters.logId, chainId: CHAIN_ID },
            data: {
              attestationResolved: true,
              attestationValid: r.parameters.isValid,
              attestationTotalValidStake: r.parameters.totalValidStake,
              attestationTotalInvalidStake: r.parameters.totalInvalidStake,
              attestationResolvedAt: new Date(r.block_timestamp),
              attestationTransactionHash: r.transaction_hash,
            },
          }),
        ),
      );
      for (const res of results) {
        if (res.count > 0) updated += res.count;
        else missing += 1;
      }
      console.log(`  processed ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
    }

    console.log(`\nDone. Updated ${updated} DogEvent rows (${missing} logIds had no matching row).`);
    const resolved = await prisma.dogEvent.count({ where: { attestationResolved: true } });
    const valid = await prisma.dogEvent.count({ where: { attestationValid: true } });
    console.log(`DogEvent: ${resolved} resolved, ${valid} valid.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

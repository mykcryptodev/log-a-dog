/**
 * One-shot script: find all unresolved attestation periods on ATTESTATION_MANAGER_V1
 * (Base mainnet) and resolve them, unlocking staked tokens for every affected user.
 *
 * Strategy: CDP SQL diff of AttestationPeriodStarted vs AttestationPeriodResolved
 * gives us every logId that was started but never resolved. We then call
 * resolveAttestationPeriod for each one whose window has already closed.
 *
 * Usage: bunx tsx scripts/resolve-all-legacy-attestations.ts
 *
 * Requires: CDP_CLIENT_TOKEN, THIRDWEB_SECRET_KEY,
 *           NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS,
 *           THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN in .env
 */

import { config as loadEnv } from "dotenv";
loadEnv();

import { createThirdwebClient, Engine, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import {
  getAttestationPeriod,
  resolveAttestationPeriod,
} from "../src/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";

const CDP_TOKEN = process.env.CDP_CLIENT_TOKEN;
if (!CDP_TOKEN) throw new Error("CDP_CLIENT_TOKEN is required");

const ATTESTATION_MANAGER_V1 = "0xcbf054aa8feb4fd0484e45b766b502bc045076b8";
const SQL_URL = "https://api.cdp.coinbase.com/platform/v2/data/query/run";

const client = createThirdwebClient({ secretKey: process.env.THIRDWEB_SECRET_KEY! });
const serverWallet = Engine.serverWallet({
  client,
  address: process.env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`,
  vaultAccessToken: process.env.THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN!,
});
const contract = getContract({ address: ATTESTATION_MANAGER_V1, client, chain: base });

interface StartedRow { parameters: { logId: string; startTime: string; endTime: string } }
interface ResolvedRow { parameters: { logId: string } }

async function runQuery<T>(sql: string): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    const res = await fetch(SQL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${CDP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql: `${sql} LIMIT ${pageSize} OFFSET ${offset}` }),
    });
    if (!res.ok) throw new Error(`CDP SQL ${res.status}: ${await res.text()}`);
    const page = ((await res.json()) as { result: T[] }).result;
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

async function main() {
  console.log("Fetching all AttestationPeriodStarted events from V1...");
  const started = await runQuery<StartedRow>(
    `SELECT parameters FROM base.events
     WHERE address = '${ATTESTATION_MANAGER_V1}' AND event_name = 'AttestationPeriodStarted'
     ORDER BY block_number ASC`
  );
  console.log(`  ${started.length} started periods`);

  console.log("Fetching all AttestationPeriodResolved events from V1...");
  const resolved = await runQuery<ResolvedRow>(
    `SELECT parameters FROM base.events
     WHERE address = '${ATTESTATION_MANAGER_V1}' AND event_name = 'AttestationPeriodResolved'
     ORDER BY block_number ASC`
  );
  const resolvedIds = new Set(resolved.map((r) => r.parameters.logId));
  console.log(`  ${resolvedIds.size} resolved periods`);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const candidates = started.filter((r) => !resolvedIds.has(r.parameters.logId));
  console.log(`\n${candidates.length} periods started but never resolved — checking each on-chain...\n`);

  let resolvedCount = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of candidates) {
    const logId = BigInt(row.parameters.logId);
    const endTime = BigInt(row.parameters.endTime);

    if (now < endTime) {
      console.log(`  logId ${logId}: still active (ends ${new Date(Number(endTime) * 1000).toISOString()}), skipping`);
      skipped++;
      continue;
    }

    // Double-check on-chain status before sending tx
    let status: number;
    try {
      const period = await getAttestationPeriod({ contract, logId });
      status = Number(period[2]);
    } catch {
      console.log(`  logId ${logId}: no on-chain period, skipping`);
      skipped++;
      continue;
    }

    if (status === 1) {
      console.log(`  logId ${logId}: already resolved on-chain, skipping`);
      skipped++;
      continue;
    }

    try {
      const tx = resolveAttestationPeriod({ contract, logId });
      const { transactionId } = await serverWallet.enqueueTransaction({ transaction: tx });
      console.log(`  logId ${logId}: resolved -> txId ${transactionId}`);
      resolvedCount++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  logId ${logId}: ERROR - ${err instanceof Error ? err.message : err}`);
      errors++;
    }
  }

  console.log(`\nDone. Resolved: ${resolvedCount}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

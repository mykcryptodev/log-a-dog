/**
 * On-chain → Postgres indexer backed by the Coinbase CDP SQL API.
 *
 * This replaces the old Thirdweb Engine webhook push pipeline (the self-hosted
 * Engine on Railway is gone). Instead of being pushed events, we *pull* decoded
 * logs from CDP's `base.events` table and upsert them into the `DogEvent` table
 * (the same read-model the webhooks used to write).
 *
 * It is invoked from three places:
 *   1. The hourly safety-net cron (`/api/cron/index-chain`) — catches anything
 *      written directly to the contract outside our app.
 *   2. Right after a user logs a dog in-app, once the tx confirms (the
 *      `indexer.refreshFeed` tRPC mutation).
 *   3. The manual "Refresh feed" button (same mutation, rate-limited).
 *
 * All writes are idempotent (unique `transactionHash` / `logId` lookups), so
 * overlapping runs and re-scans are safe. A short Redis lock coalesces
 * concurrent triggers into a single CDP scan to keep query costs down.
 */
import { db } from "~/server/db";
import { redis } from "~/server/utils/redis";
import { env } from "~/env";
import { LOG_A_DOG, ATTESTATION_MANAGER } from "~/constants/addresses";
import { sendTelegramMessage, formatDogLogMessage } from "~/lib/telegram";
import { sendNotificationToUsers } from "~/lib/neynar";

const CDP_SQL_URL = "https://api.cdp.coinbase.com/platform/v2/data/query/run";

// CDP SQL exposes decoded logs per chain in its own schema. Only chains with a
// known table are indexable here; everything else is a no-op.
const CDP_EVENTS_TABLE: Record<number, string> = {
  8453: "base.events",
};

// We track how far we've indexed with an integer block-number cursor per
// (chain, event) in Redis. Integer comparison avoids any SQL timestamp/timezone
// dialect pitfalls. On a cold start (or if the cursor is ever lost) we re-scan
// from 0 — idempotent upserts make that safe, just slightly more CDP queries once.
const BLOCK_OVERLAP = 100; // re-scan a few blocks back so nothing straddles the cursor

// Only fire "new dog" notifications for events this fresh. Prevents a backfill /
// missed-event sweep from spamming every user with old logs.
const NOTIFY_MAX_AGE_SECONDS = 2 * 60 * 60; // 2 hours

const LOCK_TTL_SECONDS = 30;

async function getCursor(key: string): Promise<number> {
  const v = await redis.get<number>(key);
  return typeof v === "number" && v > BLOCK_OVERLAP ? v - BLOCK_OVERLAP : 0;
}

async function setCursor(key: string, block: number): Promise<void> {
  await redis.set(key, block);
}

export interface IndexResult {
  chainId: number;
  ran: boolean; // false when skipped (lock held or unsupported chain)
  newLogs: number;
  updatedAttestations: number;
  reason?: string;
}

interface HotdogLoggedRow {
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

interface AttestationResolvedRow {
  block_number: string;
  block_timestamp: string; // ISO 8601
  transaction_hash: string;
  parameters: {
    logId: string;
    isValid: boolean;
    totalValidStake: string;
    totalInvalidStake: string;
  };
}

async function runCdpQuery<T>(sql: string): Promise<T[]> {
  const res = await fetch(CDP_SQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CDP_CLIENT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    throw new Error(`CDP SQL API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { result: T[] };
  return json.result;
}

async function indexHotdogLogged(chainId: number, table: string): Promise<number> {
  const contract = LOG_A_DOG[chainId];
  if (!contract) return 0;
  const address = contract.toLowerCase();
  const cursorKey = `indexer:cursor:logs:${chainId}`;

  const fromBlock = await getCursor(cursorKey);
  let offset = 0;
  const pageSize = 1000;
  let newCount = 0;
  let maxBlock = fromBlock;

  for (;;) {
    const sql = `SELECT block_number, block_timestamp, transaction_hash, log_index, parameters
      FROM ${table}
      WHERE address = '${address}' AND event_name = 'HotdogLogged' AND block_number > ${fromBlock}
      ORDER BY block_number ASC, log_index ASC
      LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await runCdpQuery<HotdogLoggedRow>(sql);
    if (rows.length === 0) break;

    // Skip rows we already have, so we only insert (and notify) genuinely new logs.
    const hashes = rows.map((r) => r.transaction_hash);
    const existing = await db.dogEvent.findMany({
      where: { transactionHash: { in: hashes } },
      select: { transactionHash: true },
    });
    const existingSet = new Set(existing.map((e) => e.transactionHash));

    for (const r of rows) {
      const block = Number(r.block_number);
      if (block > maxBlock) maxBlock = block;
      if (existingSet.has(r.transaction_hash)) continue;
      newCount += await insertHotdogLog(chainId, address, r);
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  if (maxBlock > fromBlock) await setCursor(cursorKey, maxBlock);
  return newCount;
}

async function insertHotdogLog(
  chainId: number,
  address: string,
  r: HotdogLoggedRow,
): Promise<number> {
  const blockUnix = Math.floor(new Date(r.block_timestamp).getTime() / 1000);
  const eater = r.parameters.eater.toLowerCase();

  // Link to a user if we know their address (mirrors the old webhook).
  const user = await db.user.findFirst({
    where: { address: eater },
    select: { id: true, fid: true, username: true },
  });

  try {
    const dogEvent = await db.dogEvent.create({
      data: {
        chainId: chainId.toString(),
        transactionHash: r.transaction_hash,
        address,
        blockTimestamp: BigInt(blockUnix),
        logId: r.parameters.logId,
        logger: r.parameters.logger.toLowerCase(),
        eater,
        imageUri: r.parameters.imageUri,
        metadataUri: r.parameters.metadataUri || "",
        timestamp: BigInt(r.parameters.timestamp),
        zoraCoin: r.parameters.zoraCoin,
        webhookId: `cdp-${r.transaction_hash}-${r.log_index}`,
        userId: user?.id,
      },
    });

    // Only notify for fresh logs, so a backfill of old/missed events stays quiet.
    const ageSeconds = Math.floor(Date.now() / 1000) - blockUnix;
    if (ageSeconds <= NOTIFY_MAX_AGE_SECONDS) {
      await notifyNewLog(dogEvent.id, r.parameters.logId, user);
    }
    return 1;
  } catch (error) {
    // Lost an idempotency race with a concurrent run — already inserted, fine.
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return 0;
    }
    throw error;
  }
}

async function notifyNewLog(
  dogEventId: string,
  logId: string,
  user: { fid: number | null; username: string | null } | null,
): Promise<void> {
  try {
    await sendTelegramMessage(
      formatDogLogMessage({ id: dogEventId, userFid: user?.fid }),
    );
  } catch (e) {
    console.error("[indexer] Telegram notification failed:", e);
  }
  try {
    await sendNotificationToUsers({
      title: "🌭 New Dog Logged!",
      body: `A new hotdog has been logged by ${
        user?.username ? `@${user.username}` : "someone"
      }. Check it out!`,
      target_url: `https://logadog.xyz/dog/${logId}`,
    });
  } catch (e) {
    console.error("[indexer] Neynar notification failed:", e);
  }
}

async function indexAttestationsResolved(
  chainId: number,
  table: string,
): Promise<number> {
  const manager = ATTESTATION_MANAGER[chainId];
  if (!manager) return 0;
  const address = manager.toLowerCase();
  const cursorKey = `indexer:cursor:attestations:${chainId}`;

  const fromBlock = await getCursor(cursorKey);
  let offset = 0;
  const pageSize = 1000;
  let updated = 0;
  let maxBlock = fromBlock;

  for (;;) {
    const sql = `SELECT block_number, block_timestamp, transaction_hash, parameters
      FROM ${table}
      WHERE address = '${address}' AND event_name = 'AttestationPeriodResolved' AND block_number > ${fromBlock}
      ORDER BY block_number ASC
      LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await runCdpQuery<AttestationResolvedRow>(sql);
    if (rows.length === 0) break;

    for (const r of rows) {
      const block = Number(r.block_number);
      if (block > maxBlock) maxBlock = block;
      // updateMany is idempotent: re-writing the same resolution is a no-op.
      const res = await db.dogEvent.updateMany({
        where: {
          logId: r.parameters.logId,
          chainId: chainId.toString(),
          attestationResolved: { not: true },
        },
        data: {
          attestationResolved: true,
          attestationValid: r.parameters.isValid,
          attestationTotalValidStake: r.parameters.totalValidStake,
          attestationTotalInvalidStake: r.parameters.totalInvalidStake,
          attestationResolvedAt: new Date(r.block_timestamp),
          attestationTransactionHash: r.transaction_hash,
        },
      });
      updated += res.count;
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  if (maxBlock > fromBlock) await setCursor(cursorKey, maxBlock);
  return updated;
}

/**
 * Pull new HotdogLogged + AttestationPeriodResolved events for `chainId` from
 * CDP and upsert them. A Redis lock ensures only one scan runs at a time;
 * concurrent callers return `{ ran: false }` because the in-flight scan already
 * covers their data.
 */
export async function indexChainEvents(chainId: number): Promise<IndexResult> {
  const table = CDP_EVENTS_TABLE[chainId];
  if (!table) {
    return {
      chainId,
      ran: false,
      newLogs: 0,
      updatedAttestations: 0,
      reason: `No CDP events table for chain ${chainId}`,
    };
  }

  const lockKey = `indexer:lock:${chainId}`;
  const gotLock = await redis.set(lockKey, Date.now(), {
    nx: true,
    ex: LOCK_TTL_SECONDS,
  });
  if (!gotLock) {
    return {
      chainId,
      ran: false,
      newLogs: 0,
      updatedAttestations: 0,
      reason: "Indexer already running",
    };
  }

  try {
    const newLogs = await indexHotdogLogged(chainId, table);
    const updatedAttestations = await indexAttestationsResolved(chainId, table);
    return { chainId, ran: true, newLogs, updatedAttestations };
  } finally {
    await redis.del(lockKey);
  }
}

/**
 * For the post-log trigger: wait until a specific transaction's HotdogLogged
 * event is queryable in CDP, then index. Base blocks are ~2s and CDP is <250ms
 * behind tip, so this usually resolves on the first or second poll.
 */
export async function indexAfterTransaction(
  chainId: number,
  transactionHash: string,
  { maxAttempts = 6, delayMs = 2000 }: { maxAttempts?: number; delayMs?: number } = {},
): Promise<IndexResult> {
  const table = CDP_EVENTS_TABLE[chainId];
  if (table) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rows = await runCdpQuery<{ transaction_hash: string }>(
        `SELECT transaction_hash FROM ${table}
         WHERE transaction_hash = '${transactionHash.toLowerCase()}'
         AND event_name = 'HotdogLogged' LIMIT 1`,
      );
      if (rows.length > 0) break;
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  return indexChainEvents(chainId);
}

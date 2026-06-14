/**
 * On-chain → Postgres indexer backed by the Coinbase CDP SQL API.
 *
 * This replaces the old Thirdweb Engine webhook push pipeline (the self-hosted
 * Engine on Railway is gone). Instead of being pushed events, we *pull* decoded
 * logs from CDP's `base.events` table and upsert them into Postgres read-models
 * (`DogEvent` and `AttestationVote`).
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
import { CONTEST_START_TIME } from "~/constants";
import { LOG_A_DOG, ATTESTATION_MANAGER, ATTESTATION_MANAGER_V1 } from "~/constants/addresses";
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
// from the relevant contract deployment block — idempotent upserts make overlap
// scans safe.
const BLOCK_OVERLAP = 100; // re-scan a few blocks back so nothing straddles the cursor

const DEPLOYMENT_START_BLOCKS: Record<
  number,
  { logADog: number; attestationManagerV1: number; attestationManagerV2: number }
> = {
  // contracts/broadcast/Deploy.s.sol/8453/run-latest.json
  8453: {
    logADog: 32424776,
    attestationManagerV1: 32424776,
    attestationManagerV2: 47340440,
  },
};

// Only fire "new dog" notifications for events this fresh. Prevents a backfill /
// missed-event sweep from spamming every user with old logs.
const NOTIFY_MAX_AGE_SECONDS = 2 * 60 * 60; // 2 hours

const LOCK_TTL_SECONDS = 30;

function withOverlap(block: number): number {
  return Math.max(0, block - BLOCK_OVERLAP);
}

async function getCursor(key: string, fallbackStartBlock: number): Promise<number> {
  const v = await redis.get<number>(key);
  return typeof v === "number" ? withOverlap(v) : withOverlap(fallbackStartBlock);
}

async function setCursor(key: string, block: number): Promise<void> {
  await redis.set(key, block);
}

function getAttestationSources(chainId: number): AttestationSource[] {
  const startBlocks = DEPLOYMENT_START_BLOCKS[chainId];
  const currentManager = ATTESTATION_MANAGER[chainId];
  const legacyManager = ATTESTATION_MANAGER_V1[chainId];
  const sources: AttestationSource[] = [];

  if (currentManager) {
    sources.push({
      version: "v2",
      address: currentManager.toLowerCase(),
      startBlock: startBlocks?.attestationManagerV2 ?? 0,
    });
  }

  if (
    legacyManager &&
    legacyManager.toLowerCase() !== currentManager?.toLowerCase()
  ) {
    sources.push({
      version: "v1",
      address: legacyManager.toLowerCase(),
      startBlock: startBlocks?.attestationManagerV1 ?? 0,
    });
  }

  return sources;
}

export interface IndexResult {
  chainId: number;
  ran: boolean; // false when skipped (lock held or unsupported chain)
  newLogs: number;
  newVotes: number;
  updatedAttestations: number;
  reason?: string;
}

type IndexStage = "HotdogLogged" | "AttestationMade" | "AttestationPeriodResolved";
type IndexProgressPhase = "start" | "page" | "complete" | "skip";

type AttestationSourceVersion = "v1" | "v2";

interface AttestationSource {
  version: AttestationSourceVersion;
  address: string;
  startBlock: number;
}

export interface IndexProgress {
  chainId: number;
  stage: IndexStage | "indexer";
  phase: IndexProgressPhase;
  processed: number;
  total: number;
  percent: number;
  message: string;
}

type ProgressReporter = (progress: IndexProgress) => void;

interface IndexOptions {
  onProgress?: ProgressReporter;
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

interface AttestationMadeRow {
  block_number: string;
  block_timestamp: string; // ISO 8601
  transaction_hash: string;
  log_index: number;
  parameters: {
    logId: string;
    attestor: string;
    isValid: boolean;
    stakeAmount: string;
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

async function getPendingEventCount(
  table: string,
  address: string,
  eventName: string,
  fromBlock: number,
): Promise<number> {
  const rows = await runCdpQuery<Record<string, unknown>>(
    `SELECT COUNT(*) AS total
      FROM ${table}
      WHERE address = '${address}' AND event_name = '${eventName}' AND block_number > ${fromBlock}`,
  );
  return Number(rows[0]?.total ?? 0);
}

function reportProgress(
  onProgress: ProgressReporter | undefined,
  progress: IndexProgress,
): void {
  console.log(`[indexer] ${progress.message}`);
  onProgress?.(progress);
}

function progressPercent(processed: number, total: number): number {
  if (total === 0) return 100;
  return Math.min(100, Number(((processed / total) * 100).toFixed(1)));
}

async function indexHotdogLogged(
  chainId: number,
  table: string,
  onProgress?: ProgressReporter,
): Promise<number> {
  const contract = LOG_A_DOG[chainId];
  if (!contract) return 0;
  const address = contract.toLowerCase();
  const cursorKey = `indexer:cursor:logs:${chainId}`;
  const fallbackStartBlock = DEPLOYMENT_START_BLOCKS[chainId]?.logADog ?? 0;

  const fromBlock = await getCursor(cursorKey, fallbackStartBlock);
  const total = await getPendingEventCount(table, address, "HotdogLogged", fromBlock);
  let offset = 0;
  const pageSize = 1000;
  let newCount = 0;
  let maxBlock = fromBlock;
  let processed = 0;

  reportProgress(onProgress, {
    chainId,
    stage: "HotdogLogged",
    phase: "start",
    processed,
    total,
    percent: progressPercent(processed, total),
    message: `HotdogLogged starting at block ${fromBlock}: 0/${total} (${progressPercent(processed, total)}%)`,
  });

  for (;;) {
    const sql = `SELECT block_number, block_timestamp, transaction_hash, log_index, parameters
      FROM ${table}
      WHERE address = '${address}' AND event_name = 'HotdogLogged' AND block_number > ${fromBlock}
      ORDER BY block_number ASC, log_index ASC
      LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await runCdpQuery<HotdogLoggedRow>(sql);
    if (rows.length === 0) break;
    processed += rows.length;

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

    reportProgress(onProgress, {
      chainId,
      stage: "HotdogLogged",
      phase: "page",
      processed,
      total,
      percent: progressPercent(processed, total),
      message: `HotdogLogged ${processed}/${total} (${progressPercent(processed, total)}%)`,
    });

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  if (maxBlock > fromBlock) await setCursor(cursorKey, maxBlock);
  reportProgress(onProgress, {
    chainId,
    stage: "HotdogLogged",
    phase: "complete",
    processed: total,
    total,
    percent: 100,
    message: `HotdogLogged complete: ${newCount} new logs`,
  });
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
  source: AttestationSource,
  onProgress?: ProgressReporter,
): Promise<number> {
  const address = source.address;
  const cursorKey = `indexer:cursor:${source.version}:attestations:${chainId}`;
  const fallbackStartBlock = source.startBlock;

  const fromBlock = await getCursor(cursorKey, fallbackStartBlock);
  const total = await getPendingEventCount(table, address, "AttestationPeriodResolved", fromBlock);
  let offset = 0;
  const pageSize = 1000;
  let updated = 0;
  let maxBlock = fromBlock;
  let processed = 0;

  reportProgress(onProgress, {
    chainId,
    stage: "AttestationPeriodResolved",
    phase: "start",
    processed,
    total,
    percent: progressPercent(processed, total),
    message: `${source.version} AttestationPeriodResolved starting at block ${fromBlock}: 0/${total} (${progressPercent(processed, total)}%)`,
  });

  for (;;) {
    const sql = `SELECT block_number, block_timestamp, transaction_hash, parameters
      FROM ${table}
      WHERE address = '${address}' AND event_name = 'AttestationPeriodResolved' AND block_number > ${fromBlock}
      ORDER BY block_number ASC
      LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await runCdpQuery<AttestationResolvedRow>(sql);
    if (rows.length === 0) break;
    processed += rows.length;

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

    reportProgress(onProgress, {
      chainId,
      stage: "AttestationPeriodResolved",
      phase: "page",
      processed,
      total,
      percent: progressPercent(processed, total),
      message: `${source.version} AttestationPeriodResolved ${processed}/${total} (${progressPercent(processed, total)}%)`,
    });

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  if (maxBlock > fromBlock) await setCursor(cursorKey, maxBlock);
  reportProgress(onProgress, {
    chainId,
    stage: "AttestationPeriodResolved",
    phase: "complete",
    processed: total,
    total,
    percent: 100,
    message: `${source.version} AttestationPeriodResolved complete: ${updated} updated logs`,
  });
  return updated;
}

async function indexAttestationMade(
  chainId: number,
  table: string,
  source: AttestationSource,
  onProgress?: ProgressReporter,
): Promise<number> {
  const address = source.address;
  const cursorKey = `indexer:cursor:${source.version}:votes:${chainId}`;
  const fallbackStartBlock = source.startBlock;

  const fromBlock = await getCursor(cursorKey, fallbackStartBlock);
  const total = await getPendingEventCount(table, address, "AttestationMade", fromBlock);
  let offset = 0;
  const pageSize = 1000;
  let inserted = 0;
  let maxBlock = fromBlock;
  const touchedVoters = new Set<string>();
  let processed = 0;

  reportProgress(onProgress, {
    chainId,
    stage: "AttestationMade",
    phase: "start",
    processed,
    total,
    percent: progressPercent(processed, total),
    message: `${source.version} AttestationMade starting at block ${fromBlock}: 0/${total} (${progressPercent(processed, total)}%)`,
  });

  for (;;) {
    const sql = `SELECT block_number, block_timestamp, transaction_hash, log_index, parameters
      FROM ${table}
      WHERE address = '${address}' AND event_name = 'AttestationMade' AND block_number > ${fromBlock}
      ORDER BY block_number ASC, log_index ASC
      LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await runCdpQuery<AttestationMadeRow>(sql);
    if (rows.length === 0) break;
    processed += rows.length;

    const voteRows = rows.map((r) => {
      const block = Number(r.block_number);
      if (block > maxBlock) maxBlock = block;

      const voter = r.parameters.attestor.toLowerCase();
      touchedVoters.add(voter);

      return {
        chainId: chainId.toString(),
        logId: r.parameters.logId,
        voter,
        isValid: r.parameters.isValid,
        stakeAmount: r.parameters.stakeAmount,
        transactionHash: r.transaction_hash,
        logIndex: r.log_index,
        blockNumber: BigInt(r.block_number),
        blockTimestamp: new Date(r.block_timestamp),
      };
    });

    const result = await db.attestationVote.createMany({
      data: voteRows,
      skipDuplicates: true,
    });
    inserted += result.count;

    reportProgress(onProgress, {
      chainId,
      stage: "AttestationMade",
      phase: "page",
      processed,
      total,
      percent: progressPercent(processed, total),
      message: `${source.version} AttestationMade ${processed}/${total} (${progressPercent(processed, total)}%)`,
    });

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  if (maxBlock > fromBlock) await setCursor(cursorKey, maxBlock);
  if (touchedVoters.size > 0) {
    await redis.del(`judges:ranking:${chainId}`);
    await redis.del(`judges:ranking:${chainId}:${CONTEST_START_TIME}`);
    await Promise.all(
      [...touchedVoters].flatMap((voter) => [
        redis.del(`votes:${chainId}:${voter}`),
        redis.del(`votes:${chainId}:${voter}:${CONTEST_START_TIME}`),
      ]),
    );
  }
  reportProgress(onProgress, {
    chainId,
    stage: "AttestationMade",
    phase: "complete",
    processed: total,
    total,
    percent: 100,
    message: `${source.version} AttestationMade complete: ${inserted} new votes`,
  });
  return inserted;
}

/**
 * Pull new HotdogLogged + AttestationMade + AttestationPeriodResolved events
 * for `chainId` from CDP and upsert them. A Redis lock ensures only one scan
 * runs at a time; concurrent callers return `{ ran: false }` because the
 * in-flight scan already covers their data.
 */
export async function indexChainEvents(
  chainId: number,
  options: IndexOptions = {},
): Promise<IndexResult> {
  const table = CDP_EVENTS_TABLE[chainId];
  if (!table) {
    reportProgress(options.onProgress, {
      chainId,
      stage: "indexer",
      phase: "skip",
      processed: 0,
      total: 0,
      percent: 100,
      message: `No CDP events table for chain ${chainId}`,
    });
    return {
      chainId,
      ran: false,
      newLogs: 0,
      newVotes: 0,
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
    reportProgress(options.onProgress, {
      chainId,
      stage: "indexer",
      phase: "skip",
      processed: 0,
      total: 0,
      percent: 100,
      message: "Indexer already running",
    });
    return {
      chainId,
      ran: false,
      newLogs: 0,
      newVotes: 0,
      updatedAttestations: 0,
      reason: "Indexer already running",
    };
  }

  try {
    const newLogs = await indexHotdogLogged(chainId, table, options.onProgress);
    const attestationSources = getAttestationSources(chainId);
    let newVotes = 0;
    let updatedAttestations = 0;

    for (const source of attestationSources) {
      newVotes += await indexAttestationMade(chainId, table, source, options.onProgress);
      updatedAttestations += await indexAttestationsResolved(chainId, table, source, options.onProgress);
    }

    return { chainId, ran: true, newLogs, newVotes, updatedAttestations };
  } finally {
    await redis.del(lockKey);
  }
}

/**
 * For post-transaction triggers: wait until the transaction's known app event is
 * queryable in CDP, then index. Base blocks are ~2s and CDP is usually close to
 * tip, so this usually resolves on the first or second poll.
 */
export async function indexAfterTransaction(
  chainId: number,
  transactionHash: string,
  {
    maxAttempts = 6,
    delayMs = 2000,
    onProgress,
  }: { maxAttempts?: number; delayMs?: number; onProgress?: ProgressReporter } = {},
): Promise<IndexResult> {
  const table = CDP_EVENTS_TABLE[chainId];
  if (table) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rows = await runCdpQuery<{ transaction_hash: string }>(
        `SELECT transaction_hash FROM ${table}
         WHERE transaction_hash = '${transactionHash.toLowerCase()}'
         AND event_name IN ('HotdogLogged', 'AttestationMade', 'AttestationPeriodResolved')
         LIMIT 1`,
      );
      if (rows.length > 0) break;
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  return indexChainEvents(chainId, { onProgress });
}

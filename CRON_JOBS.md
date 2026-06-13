# Cron Jobs Documentation

This document describes the automated cron jobs configured for the Log a Dog application.

> **Indexing model**: On-chain state reaches the Supabase/Postgres read-model via
> a **pull-based indexer** backed by the Coinbase CDP SQL API, not via Thirdweb
> Engine webhooks (the self-hosted Engine is gone). See
> [On-Chain Indexer](#on-chain-indexer-cdp-sql) below and
> `WEBHOOK_DOCUMENTATION.md`.

## On-Chain Indexer (CDP SQL)

**Endpoint**: `/api/cron/index-chain`
**Schedule**: Every hour (`0 * * * *`)
**Purpose**: Safety-net sweep that pulls new on-chain events into the database

### What it does

Calls `indexChainEvents(DEFAULT_CHAIN.id)` (`src/server/utils/indexer.ts`), which
queries the CDP SQL API (`base.events`) for new `HotdogLogged` and
`AttestationPeriodResolved` events since the last indexed block and upserts them
into the `DogEvent` table:

1. **`HotdogLogged`** → inserts new `DogEvent` rows (links to a `User` by eater
   address when known, and fires Telegram/Neynar notifications for events less
   than 2 hours old).
2. **`AttestationPeriodResolved`** → updates the matching `DogEvent` with
   `attestationResolved`, `attestationValid`, stake totals, resolution timestamp
   and tx hash.

This cron is a backstop. The feed is normally kept fresh **on demand** — the same
indexer runs right after a user logs a dog in-app (once the tx confirms) and when
anyone clicks the "Refresh feed" button (`indexer.refreshFeed` tRPC mutation,
per-identity 20s cooldown). The hourly run catches anything written directly to
the contract outside the app, or any on-demand run that failed.

### How it stays cheap and safe

- **Block-number cursors** in Redis (`indexer:cursor:logs|attestations:{chainId}`)
  mean each run only scans new blocks — typically ~2 CDP queries/hour.
- A **Redis lock** (`indexer:lock:{chainId}`, 30s TTL) coalesces concurrent
  triggers (cron + on-log + button) into a single CDP scan.
- All writes are **idempotent** (unique `transactionHash` / per-`logId` updates),
  so overlapping runs and cold-start re-scans are harmless.
- Only **Base mainnet (8453)** is indexed — CDP `base.events` is mainnet-only.

### Configuration

**Required Environment Variables:**
- `CRON_SECRET` - authenticates the cron request from Vercel
- `CDP_CLIENT_TOKEN` - Coinbase CDP Client API key (the SQL API source)

See the combined `vercel.json` crons block under
[Automated Moderator Rewards](#configuration) below.

## Automated Moderator Rewards

**Endpoint**: `/api/cron/reward-moderators`  
**Schedule**: Every hour (`0 * * * *`)  
**Purpose**: Automatically rewards moderators for resolved attestation periods

### What it does

This cron job automatically executes the "Reward Moderators" functionality on a schedule, eliminating the need for manual intervention. It uses the Supabase database to find candidates and relies on the CDP-backed indexer to write resolution results back to the database:

1. **Finds eligible events** - Queries the Supabase database for DogEvents that:
   - Were created more than `ATTESTATION_WINDOW_SECONDS` ago (attestation window has passed)
   - Have `attestationResolved` set to `false` or `null`
   - May have attestation activity to resolve

2. **Validates on-chain state** - For each event:
   - Checks if an attestation period exists on-chain
   - Verifies the attestation window has ended
   - Confirms the period is still in "Active" status (not already resolved)
   - Ensures there are stakes to distribute

3. **Executes rewards** - Calls the smart contract's `resolveAttestationPeriod` function which:
   - Determines the winning side (valid vs invalid) based on total stakes
   - Slashes 15% from the losing side's stakes
   - Distributes slashed tokens proportionally to winners
   - Unlocks remaining stakes for all participants

4. **Indexer handles database updates** - When the transaction is mined:
   - The `AttestationPeriodResolved` event is emitted on-chain
   - The CDP-backed indexer (the hourly `/api/cron/index-chain` run, or any
     on-demand `indexer.refreshFeed`) reads it from `base.events` and updates the
     database
   - Sets `attestationResolved` to `true`, `attestationValid`, stake amounts, and timestamps

### Configuration

**Required Environment Variables:**
- `CRON_SECRET` - A secret token used to authenticate cron requests from Vercel

**Vercel Configuration** (`vercel.json`) — both crons:
```json
{
  "crons": [
    {
      "path": "/api/cron/reward-moderators",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/index-chain",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Security

- The endpoint validates the `CRON_SECRET` to ensure only authorized requests from Vercel can trigger the job
- Uses the server wallet to execute transactions securely
- Processes events in batches of 50 to avoid timeouts

### Monitoring

The cron job returns detailed information about its execution:

```json
{
  "success": true,
  "summary": {
    "totalEligible": 10,
    "processed": 5,
    "skipped": 4,
    "errors": 1
  },
  "details": [
    {
      "logId": "123",
      "status": "processed",
      "transactionId": "0x..."
    },
    {
      "logId": "124", 
      "status": "skipped",
      "reason": "No attestation period found"
    }
  ]
}
```

### Common Skip Reasons

- **"No attestation period found"** - Log has no on-chain attestation activity
- **"Attestation period still active"** - Attestation window hasn't elapsed yet
- **"Already resolved on-chain"** - Another process already resolved this period
- **"No stakes to resolve"** - No moderators participated in this attestation

### Error Handling

- Individual event processing errors are caught and logged
- Failed events don't prevent processing of other events
- Detailed error information is included in the response
- Database updates are handled by the CDP-backed indexer once transactions are mined
- Events are only marked resolved in the DB after the indexer reads the on-chain `AttestationPeriodResolved` event

### Performance

- Processes events in ascending chronological order (oldest first)
- Includes 1-second delays between transactions to avoid rate limiting
- Batches processing to 50 events per run to stay within serverless timeout limits
- Uses efficient database queries with proper indexing

This automation ensures that moderator rewards are distributed promptly without requiring manual intervention. The CDP-backed indexer provides reliable database consistency and improves the user experience while ensuring fair compensation for community moderators.
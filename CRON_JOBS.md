# Cron Jobs Documentation

This document describes the automated cron jobs configured for the Log a Dog application.

## Automated Moderator Rewards

**Endpoint**: `/api/cron/reward-moderators`  
**Schedule**: Every hour (`0 * * * *`)  
**Purpose**: Automatically rewards moderators for resolved attestation periods

### What it does

This cron job automatically executes the "Reward Moderators" functionality on a schedule, eliminating the need for manual intervention. It uses the Supabase database as the source of truth and relies on webhooks for automatic database updates:

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

4. **Webhook handles database updates** - When the transaction is mined:
   - The `AttestationPeriodResolved` event is emitted on-chain
   - The attestation webhook (`/api/webhook/attestation-resolved`) automatically updates the database
   - Sets `attestationResolved` to `true`, `attestationValid`, stake amounts, and timestamps

### Configuration

**Required Environment Variables:**
- `CRON_SECRET` - A secret token used to authenticate cron requests from Vercel

**Vercel Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/reward-moderators",
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
- Database updates are handled automatically by webhooks when transactions are mined
- Events are only marked as processed by webhooks after successful on-chain resolution

### Performance

- Processes events in ascending chronological order (oldest first)
- Includes 1-second delays between transactions to avoid rate limiting
- Batches processing to 50 events per run to stay within serverless timeout limits
- Uses efficient database queries with proper indexing

This automation ensures that moderator rewards are distributed promptly without requiring manual intervention. The webhook-driven architecture provides reliable database consistency and improves the user experience while ensuring fair compensation for community moderators.
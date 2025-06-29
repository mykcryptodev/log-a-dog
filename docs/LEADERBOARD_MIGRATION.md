# Leaderboard Migration: Grouping by FID

## Overview
This migration updates the leaderboard to group users by their Farcaster ID (FID) instead of individual Ethereum addresses. This solves the issue where the same user with multiple Ethereum addresses would appear multiple times on the leaderboard.

## Changes Made

### 1. Immediate Fix - Updated Leaderboard Query
Modified `src/server/api/dog-events.ts` - `getDogEventLeaderboard` function:
- Now joins DogEvents with the User table
- Groups by FID when available, falls back to address when FID is not available
- Returns additional metadata including all addresses associated with a FID

### 2. Schema Updates
Updated `prisma/schema.prisma`:
- Added `dogEvents DogEvent[]` relation to the User model
- Added `user` and `userId` fields to the DogEvent model
- Added index on `userId` for performance

### 3. Webhook Updates
Updated `src/pages/api/webhook/dog-events.ts`:
- Now looks up users by eater address when creating DogEvents
- Links DogEvents to Users via the `userId` field

## Migration Steps

1. **Update your database schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Create and run the migration script** to link existing DogEvents to Users:
   ```typescript
   // src/scripts/migrate-dog-events.ts
   import { db } from "~/server/db";

   async function migrateExistingDogEvents() {
     console.log('Starting migration...');
     
     const dogEventsWithoutUser = await db.dogEvent.findMany({
       where: { userId: null },
       select: { id: true, eater: true }
     });

     console.log(`Found ${dogEventsWithoutUser.length} events to migrate`);

     let updated = 0;
     const batchSize = 100;

     for (let i = 0; i < dogEventsWithoutUser.length; i += batchSize) {
       const batch = dogEventsWithoutUser.slice(i, i + batchSize);
       
       await Promise.all(
         batch.map(async (event) => {
           const user = await db.user.findFirst({
             where: { address: event.eater.toLowerCase() }
           });

           if (user) {
             await db.dogEvent.update({
               where: { id: event.id },
               data: { userId: user.id }
             });
             updated++;
           }
         })
       );

       console.log(`Progress: ${Math.min(i + batchSize, dogEventsWithoutUser.length)}/${dogEventsWithoutUser.length}`);
     }

     console.log(`Migration complete! Updated ${updated} events`);
   }
   ```

   Run with: `npx tsx src/scripts/migrate-dog-events.ts`

3. **Clear Redis cache** to ensure the leaderboard reflects the new grouping:
   ```bash
   # Connect to Redis and flush leaderboard cache
   redis-cli
   > DEL leaderboard:*
   ```

## How It Works

1. **User Authentication**: When users authenticate, their FID is fetched from Neynar (Farcaster API) and stored in the User table.

2. **Event Creation**: When new DogEvents are created via webhook, the system looks up the user by their eater address and links the event.

3. **Leaderboard Display**: The leaderboard now:
   - Groups all addresses belonging to the same FID together
   - Shows the total count across all addresses
   - Falls back to grouping by address for users without FID

## Benefits

- **Accurate Rankings**: Users with multiple addresses are now counted as one entity
- **Better UX**: Users see their true ranking regardless of which address they use
- **Future-proof**: New addresses automatically get grouped when users link them to their Farcaster account

## Troubleshooting

If the leaderboard is not updating:
1. Clear the Redis cache for leaderboard data
2. Ensure all DogEvents have been migrated (check for null userId)
3. Verify users have FIDs by checking the User table

## Notes

- Users without Farcaster accounts (no FID) will still be grouped by individual address
- The system prioritizes the first address associated with an FID for display purposes
- Historical data is preserved - only the grouping logic changes
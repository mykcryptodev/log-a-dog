import { db } from "~/server/db";

async function migrateExistingDogEvents() {
  console.log('Starting migration to link DogEvents to Users...');
  
  try {
    // Get all dog events that don't have a userId
    const dogEventsWithoutUser = await db.dogEvent.findMany({
      where: { userId: null },
      select: { id: true, eater: true }
    });

    console.log(`Found ${dogEventsWithoutUser.length} DogEvents without a user link`);

    if (dogEventsWithoutUser.length === 0) {
      console.log('No events to migrate. All DogEvents are already linked to users.');
      return;
    }

    let updated = 0;
    let notFound = 0;
    const batchSize = 100;

    for (let i = 0; i < dogEventsWithoutUser.length; i += batchSize) {
      const batch = dogEventsWithoutUser.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(async (event: { id: string; eater: string }) => {
          const user = await db.user.findFirst({
            where: { address: event.eater.toLowerCase() },
            select: { id: true, address: true, fid: true }
          });

          if (user) {
            await db.dogEvent.update({
              where: { id: event.id },
              data: { userId: user.id }
            });
            return { success: true, user };
          }
          return { success: false };
        })
      );

      const batchUpdated = results.filter((r: any) => r.success).length;
      updated += batchUpdated;
      notFound += results.filter((r: any) => !r.success).length;

      console.log(`Progress: ${Math.min(i + batchSize, dogEventsWithoutUser.length)}/${dogEventsWithoutUser.length} events processed`);
      console.log(`  - Batch results: ${batchUpdated} linked, ${batch.length - batchUpdated} users not found`);
    }

    console.log('\n=== Migration Complete! ===');
    console.log(`Total events processed: ${dogEventsWithoutUser.length}`);
    console.log(`Successfully linked: ${updated} events`);
    console.log(`Users not found: ${notFound} events`);
    console.log(`Success rate: ${((updated / dogEventsWithoutUser.length) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateExistingDogEvents()
  .then(() => {
    console.log('\nMigration script completed successfully!');
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
  })
  .finally(async () => {
    await db.$disconnect();
  });
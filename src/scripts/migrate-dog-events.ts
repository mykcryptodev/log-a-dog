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
    let errors = 0;

    // Process events sequentially to avoid connection pool issues
    for (let i = 0; i < dogEventsWithoutUser.length; i++) {
      const event = dogEventsWithoutUser[i];
      
      try {
        console.log(`Processing event ${i + 1}/${dogEventsWithoutUser.length} - Eater: ${event!.eater}`);
        
        const user = await db.user.findFirst({
          where: { address: event!.eater.toLowerCase() },
          select: { id: true, address: true, fid: true }
        });

        if (user) {
          await db.dogEvent.update({
            where: { id: event!.id },
            data: { userId: user.id }
          });
          updated++;
          console.log(`  ✓ Linked to user ${user.address} (FID: ${user.fid || 'none'})`);
        } else {
          notFound++;
          console.log(`  ✗ No user found for address ${event!.eater}`);
        }
      } catch (error) {
        errors++;
        console.error(`  ✗ Error processing event ${event!.id}:`, error);
        
        // If we get a connection error, wait a bit before continuing
        if (error instanceof Error && error.message.includes("Can't reach database")) {
          console.log('  Waiting 2 seconds before continuing...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.log('\n=== Migration Complete! ===');
    console.log(`Total events processed: ${dogEventsWithoutUser.length}`);
    console.log(`Successfully linked: ${updated} events`);
    console.log(`Users not found: ${notFound} events`);
    console.log(`Errors: ${errors} events`);
    
    if (errors > 0) {
      console.log('\nNote: Some events had errors. You may want to run the migration again.');
    }

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
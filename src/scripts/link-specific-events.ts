import { db } from "~/server/db";

async function linkSpecificEvents() {
  console.log('Linking specific unlinked events...\n');

  try {
    // These are the unlinked events from the diagnostic
    const eventIds = [
      'cmchxfxqw0003slg3ut3q4cb4',
      'cmchxdeuf0002slg3nmfxg16i'
    ];

    for (const eventId of eventIds) {
      const event = await db.dogEvent.findUnique({
        where: { id: eventId },
        select: { 
          id: true, 
          eater: true, 
          userId: true,
          transactionHash: true 
        }
      });

      if (!event) {
        console.log(`Event ${eventId} not found`);
        continue;
      }

      if (event.userId) {
        console.log(`Event ${eventId} already linked to user ${event.userId}`);
        continue;
      }

      // Find the user
      const user = await db.user.findFirst({
        where: { 
          address: event.eater.toLowerCase() 
        },
        select: { 
          id: true, 
          address: true, 
          fid: true 
        }
      });

      if (user) {
        // Link the event to the user
        await db.dogEvent.update({
          where: { id: eventId },
          data: { userId: user.id }
        });
        
        console.log(`✓ Linked event ${eventId} to user ${user.id}`);
        console.log(`  Eater: ${event.eater}`);
        console.log(`  User address: ${user.address}`);
        console.log(`  User FID: ${user.fid}`);
        console.log(`  Tx: ${event.transactionHash}`);
      } else {
        console.log(`✗ No user found for event ${eventId} with eater ${event.eater}`);
      }
    }

    // Check if there are any other unlinked events
    const remainingUnlinked = await db.dogEvent.count({
      where: { userId: null }
    });
    
    console.log(`\nRemaining unlinked events: ${remainingUnlinked}`);

  } catch (error) {
    console.error('Error linking events:', error);
    throw error;
  }
}

// Run the script
linkSpecificEvents()
  .then(() => {
    console.log('\nScript completed successfully!');
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
  })
  .finally(async () => {
    await db.$disconnect();
  });
import { db } from "~/server/db";

async function fixAddressCase() {
  console.log('Starting address normalization...');
  
  try {
    // Fix User addresses
    console.log('\n=== Fixing User addresses ===');
    const users = await db.user.findMany({
      where: {
        address: {
          not: null
        }
      },
      select: {
        id: true,
        address: true
      }
    });

    let userUpdates = 0;
    for (const user of users) {
      if (user.address && user.address !== user.address.toLowerCase()) {
        console.log(`Fixing user ${user.id}: ${user.address} → ${user.address.toLowerCase()}`);
        await db.user.update({
          where: { id: user.id },
          data: { address: user.address.toLowerCase() }
        });
        userUpdates++;
      }
    }
    console.log(`Fixed ${userUpdates} user addresses`);

    // Fix DogEvent eater addresses
    console.log('\n=== Fixing DogEvent eater addresses ===');
    const dogEvents = await db.dogEvent.findMany({
      select: {
        id: true,
        eater: true,
        logger: true
      }
    });

    let eventUpdates = 0;
    for (const event of dogEvents) {
      const needsUpdate = 
        event.eater !== event.eater.toLowerCase() ||
        event.logger !== event.logger.toLowerCase();
      
      if (needsUpdate) {
        console.log(`Fixing event ${event.id}:`);
        console.log(`  eater: ${event.eater} → ${event.eater.toLowerCase()}`);
        console.log(`  logger: ${event.logger} → ${event.logger.toLowerCase()}`);
        
        await db.dogEvent.update({
          where: { id: event.id },
          data: { 
            eater: event.eater.toLowerCase(),
            logger: event.logger.toLowerCase()
          }
        });
        eventUpdates++;
      }
    }
    console.log(`Fixed ${eventUpdates} dog events`);

    // Fix Account providerAccountIds for ethereum type
    console.log('\n=== Fixing Account addresses ===');
    const accounts = await db.account.findMany({
      where: {
        provider: 'ethereum'
      },
      select: {
        id: true,
        providerAccountId: true
      }
    });

    let accountUpdates = 0;
    for (const account of accounts) {
      if (account.providerAccountId !== account.providerAccountId.toLowerCase()) {
        console.log(`Fixing account ${account.id}: ${account.providerAccountId} → ${account.providerAccountId.toLowerCase()}`);
        await db.account.update({
          where: { id: account.id },
          data: { providerAccountId: account.providerAccountId.toLowerCase() }
        });
        accountUpdates++;
      }
    }
    console.log(`Fixed ${accountUpdates} account addresses`);

    console.log('\n=== Address normalization complete! ===');
    console.log(`Total fixes: ${userUpdates + eventUpdates + accountUpdates}`);

  } catch (error) {
    console.error('Address normalization failed:', error);
    throw error;
  }
}

// Run the script
fixAddressCase()
  .then(() => {
    console.log('\nScript completed successfully!');
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
  })
  .finally(async () => {
    await db.$disconnect();
  });
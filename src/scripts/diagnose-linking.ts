import { db } from "~/server/db";

async function diagnoseLinking() {
  console.log('=== Diagnostic Report: DogEvent to User Linking ===\n');

  try {
    // 1. Check recent unlinked DogEvents
    const unlinkedEvents = await db.dogEvent.findMany({
      where: { userId: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        eater: true,
        createdAt: true,
        transactionHash: true
      }
    });

    console.log(`Recent unlinked DogEvents (${unlinkedEvents.length}):`);
    unlinkedEvents.forEach((event: any) => {
      console.log(`  - Event ${event.id}:`);
      console.log(`    Eater: "${event.eater}"`);
      console.log(`    Length: ${event.eater.length} chars`);
      console.log(`    Created: ${event.createdAt}`);
      console.log(`    Tx: ${event.transactionHash}`);
    });

    // 2. Check if users exist with those addresses
    console.log('\n--- Checking if users exist for these addresses ---');
    for (const event of unlinkedEvents) {
      // Try multiple variations
      const variations = [
        event.eater,
        event.eater.toLowerCase(),
        event.eater.toUpperCase(),
        `0x${event.eater.slice(2).toLowerCase()}`,
        `0x${event.eater.slice(2).toUpperCase()}`
      ];

      console.log(`\nChecking address variations for ${event.eater}:`);
      
      for (const addr of variations) {
        const user = await db.user.findFirst({
          where: { address: addr },
          select: { id: true, address: true, fid: true }
        });
        
        if (user) {
          console.log(`  ✓ FOUND with variation "${addr}": User ${user.id}, FID: ${user.fid}`);
        }
      }

      // Check partial matches
      const partialMatches = await db.user.findMany({
        where: {
          address: {
            contains: event.eater.slice(2, 10).toLowerCase()
          }
        },
        select: { id: true, address: true }
      });

      if (partialMatches.length > 0) {
        console.log(`  Partial matches found:`);
        partialMatches.forEach((match: any) => {
          console.log(`    - User ${match.id}: "${match.address}"`);
        });
      }
    }

    // 3. Check all users with addresses
    console.log('\n--- All users with addresses ---');
    const usersWithAddresses = await db.user.findMany({
      where: { address: { not: null } },
      select: { id: true, address: true, fid: true }
    });

    console.log(`Total users with addresses: ${usersWithAddresses.length}`);
    console.log('Sample addresses (first 5):');
    usersWithAddresses.slice(0, 5).forEach((user: any) => {
      console.log(`  - User ${user.id}: "${user.address}" (${user.address?.length} chars), FID: ${user.fid}`);
    });

    // 4. Check for linked DogEvents
    const linkedEvents = await db.dogEvent.findMany({
      where: { userId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true }
    });

    console.log(`\n--- Successfully linked DogEvents (${linkedEvents.length}) ---`);
    linkedEvents.forEach((event: any) => {
      console.log(`  - Event ${event.id}:`);
      console.log(`    Eater: "${event.eater}"`);
      console.log(`    User: ${event.userId} (address: "${event.user?.address}")`);
    });

    // 5. Check for address format issues
    console.log('\n--- Address Format Analysis ---');
    const allAddresses = [
      ...usersWithAddresses.map((u: any) => ({ type: 'user', address: u.address! })),
      ...unlinkedEvents.map((e: any) => ({ type: 'event', address: e.eater }))
    ];

    const formats = {
      lowercase: 0,
      uppercase: 0,
      mixed: 0,
      withPrefix: 0,
      withoutPrefix: 0,
      length42: 0,
      otherLength: 0
    };

    allAddresses.forEach(({ type, address }) => {
      if (address.startsWith('0x') || address.startsWith('0X')) formats.withPrefix++;
      else formats.withoutPrefix++;

      if (address.length === 42) formats.length42++;
      else formats.otherLength++;

      const mainPart = address.startsWith('0x') || address.startsWith('0X') ? address.slice(2) : address;
      
      if (mainPart === mainPart.toLowerCase()) formats.lowercase++;
      else if (mainPart === mainPart.toUpperCase()) formats.uppercase++;
      else formats.mixed++;
    });

    console.log('Address formats found:');
    console.log(`  - With 0x prefix: ${formats.withPrefix}`);
    console.log(`  - Without prefix: ${formats.withoutPrefix}`);
    console.log(`  - Length 42 (standard): ${formats.length42}`);
    console.log(`  - Other length: ${formats.otherLength}`);
    console.log(`  - All lowercase: ${formats.lowercase}`);
    console.log(`  - All uppercase: ${formats.uppercase}`);
    console.log(`  - Mixed case: ${formats.mixed}`);

  } catch (error) {
    console.error('Diagnostic failed:', error);
    throw error;
  }
}

// Run diagnostics
diagnoseLinking()
  .then(() => {
    console.log('\n=== Diagnostic Complete ===');
  })
  .catch((error) => {
    console.error('\nDiagnostic failed:', error);
  })
  .finally(async () => {
    await db.$disconnect();
  });
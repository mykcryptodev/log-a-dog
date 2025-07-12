import { db } from "~/server/db";
import { neynarClient } from "~/lib/neynar";

async function withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
  let retries = 3;
  while (retries > 0) {
    try {
      return await operation();
    } catch (err) {
      console.error(`Database operation failed in ${context} (${4 - retries}/3):`, err);
      retries--;
      if (retries === 0) throw err;
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  throw new Error("Unexpected end of retry loop");
}

async function backfill() {
  const users = await db.user.findMany({
    where: { neynarScore: null, address: { not: null } },
    select: { id: true, address: true },
  });
  console.log(`Found ${users.length} users without Neynar score`);

  const batchSize = 25;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const addresses = batch.map(u => u.address!.toLowerCase());
    try {
      const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({ addresses });
      for (const user of batch) {
        const key = user.address!.toLowerCase();
        const score = response[key]?.[0]?.score;
        if (typeof score === "number") {
          await withRetry(() => db.user.update({ where: { id: user.id }, data: { neynarScore: score } }), 'update user');
          console.log(`Updated ${key} with score ${score}`);
        } else {
          console.log(`No Neynar score found for ${key}`);
        }
      }
    } catch (err) {
      console.error('Error fetching batch', err);
    }
  }
}

backfill().catch(err => {
  console.error('Backfill failed', err);
}).finally(async () => {
  await db.$disconnect();
});

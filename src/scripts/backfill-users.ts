/**
 * Backfill the User table from addresses found in DogEvent and AttestationVote.
 *
 * For each unique address:
 *  - Creates a User row if none exists with that address.
 *  - If a User already exists, only fills null fields (never overwrites).
 *  - Looks up Farcaster identity via Neynar bulk endpoint (up to 350 addresses/call).
 *
 * Run with:
 *   bun run script:backfill-users
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_CHUNK_SIZE = 350;

if (!NEYNAR_API_KEY) {
  console.error("NEYNAR_API_KEY is not set");
  process.exit(1);
}

const db = new PrismaClient();

type NeynarFullUser = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verified_addresses: {
    eth_addresses: string[];
  };
};

type NeynarBulkResponse = Record<string, NeynarFullUser[]>;

async function fetchNeynarBulk(
  addresses: string[]
): Promise<Map<string, NeynarFullUser>> {
  const result = new Map<string, NeynarFullUser>();
  if (addresses.length === 0) return result;

  const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addresses.join(",")}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      api_key: NEYNAR_API_KEY!,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Neynar error ${response.status}: ${body}`);
    return result;
  }

  const data = (await response.json()) as NeynarBulkResponse;

  for (const [address, users] of Object.entries(data)) {
    const user = users[0];
    if (user) result.set(address.toLowerCase(), user);
  }

  return result;
}

async function main() {
  console.log("Collecting addresses from DogEvent and AttestationVote...");

  const [dogEventRows, voteRows] = await Promise.all([
    db.dogEvent.findMany({
      select: { logger: true, eater: true },
    }),
    db.attestationVote.findMany({
      select: { voter: true },
    }),
  ]);

  const allAddresses = new Set<string>();
  for (const row of dogEventRows) {
    if (row.logger) allAddresses.add(row.logger.toLowerCase());
    if (row.eater) allAddresses.add(row.eater.toLowerCase());
  }
  for (const row of voteRows) {
    if (row.voter) allAddresses.add(row.voter.toLowerCase());
  }

  const uniqueAddresses = Array.from(allAddresses);
  console.log(`Found ${uniqueAddresses.length} unique addresses.`);

  // Load existing users keyed by address (lowercase)
  const existingUsers = await db.user.findMany({
    where: { address: { in: uniqueAddresses } },
    select: { id: true, address: true, fid: true, name: true, image: true, username: true },
  });

  const userByAddress = new Map(
    existingUsers
      .filter((u): u is typeof u & { address: string } => u.address !== null)
      .map((u) => [u.address.toLowerCase(), u])
  );

  // Determine which addresses still need Neynar lookup:
  // - No user at all, OR user exists but has no fid and no name
  const needsNeynar = uniqueAddresses.filter((addr) => {
    const existing = userByAddress.get(addr);
    if (!existing) return true;
    // If fid is already set, we have all we need
    if (existing.fid !== null) return false;
    // If name is already set but no fid, still worth checking
    return true;
  });

  console.log(`${needsNeynar.length} addresses need Neynar lookup.`);

  // Batch Neynar calls
  const neynarMap = new Map<string, NeynarFullUser>();
  for (let i = 0; i < needsNeynar.length; i += NEYNAR_CHUNK_SIZE) {
    const chunk = needsNeynar.slice(i, i + NEYNAR_CHUNK_SIZE);
    const chunkNum = Math.floor(i / NEYNAR_CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(needsNeynar.length / NEYNAR_CHUNK_SIZE);
    console.log(`Neynar call ${chunkNum}/${totalChunks} (${chunk.length} addresses)...`);

    const partial = await fetchNeynarBulk(chunk);
    partial.forEach((user, addr) => neynarMap.set(addr, user));

    // Brief pause between chunks to be polite to the API
    if (i + NEYNAR_CHUNK_SIZE < needsNeynar.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`Neynar returned data for ${neynarMap.size} addresses.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const addr of uniqueAddresses) {
    const neynarUser = neynarMap.get(addr);
    const existing = userByAddress.get(addr);

    if (!existing) {
      // Create new user
      await db.user.create({
        data: {
          address: addr,
          fid: neynarUser?.fid ?? null,
          name: neynarUser?.display_name ?? null,
          username: neynarUser?.username ?? null,
          image: neynarUser?.pfp_url ?? null,
        },
      });
      created++;
    } else {
      // Only fill null fields
      const patch: Record<string, unknown> = {};
      if (existing.fid === null && neynarUser?.fid != null) patch.fid = neynarUser.fid;
      if (existing.name === null && neynarUser?.display_name) patch.name = neynarUser.display_name;
      if (existing.username === null && neynarUser?.username) patch.username = neynarUser.username;
      if (existing.image === null && neynarUser?.pfp_url) patch.image = neynarUser.pfp_url;

      if (Object.keys(patch).length > 0) {
        await db.user.update({ where: { id: existing.id }, data: patch });
        updated++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}, Skipped (already full): ${skipped}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  void db.$disconnect();
  process.exit(1);
});

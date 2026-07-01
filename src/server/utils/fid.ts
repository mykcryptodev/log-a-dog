import { neynarClient } from "~/lib/neynar";
import { db } from "~/server/db";

export type AddressGroup = {
  key: string;
  fid?: number;
  addresses: string[];
};

/** Map wallet addresses to Farcaster FIDs (DB first, then Neynar). */
export async function getAddressFidMap(
  addresses: string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))];
  const addressToFid = new Map<string, number>();
  if (unique.length === 0) return addressToFid;

  const dbUsers = await db.user.findMany({
    where: { address: { in: unique } },
    select: { address: true, fid: true },
  });

  for (const user of dbUsers) {
    if (user.address && user.fid) {
      addressToFid.set(user.address.toLowerCase(), user.fid);
    }
  }

  const missingFid = unique.filter((a) => !addressToFid.has(a));
  if (missingFid.length > 0) {
    try {
      const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
        addresses: missingFid,
      });
      for (const addr of missingFid) {
        const fid = response[addr]?.[0]?.fid;
        if (fid) addressToFid.set(addr, fid);
      }
    } catch (error) {
      console.error("Error fetching FIDs from Neynar:", error);
    }
  }

  return addressToFid;
}

/** Group addresses by shared Farcaster FID, or by address when no FID is known. */
export async function buildAddressGroups(
  addresses: string[],
): Promise<AddressGroup[]> {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))];
  if (unique.length === 0) return [];

  const addressToFid = await getAddressFidMap(unique);
  const fidToAddresses = new Map<number, Set<string>>();

  for (const [addr, fid] of addressToFid) {
    if (!fidToAddresses.has(fid)) fidToAddresses.set(fid, new Set());
    fidToAddresses.get(fid)!.add(addr);
  }

  const groups = new Map<string, AddressGroup>();

  for (const [fid, addrs] of fidToAddresses) {
    groups.set(`fid:${fid}`, {
      key: `fid:${fid}`,
      fid,
      addresses: Array.from(addrs),
    });
  }

  for (const addr of unique) {
    if (!addressToFid.has(addr)) {
      groups.set(`addr:${addr}`, { key: `addr:${addr}`, addresses: [addr] });
    }
  }

  return Array.from(groups.values());
}

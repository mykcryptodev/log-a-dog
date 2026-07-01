/**
 * Pure merkle/airdrop eligibility helpers (no thirdweb deps).
 */

export interface SnapshotEntry {
  recipient: string;
  amount: number;
}

export function parseAirdropCsv(csvData: string): SnapshotEntry[] {
  const lines = csvData.trim().split("\n");
  const entries: SnapshotEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const parts = line.split(",");
    const address = parts[0]?.trim();
    const amount = parts[1]?.trim();

    if (address && amount) {
      entries.push({
        recipient: address,
        amount: parseFloat(amount),
      });
    }
  }

  return entries;
}

export function isAddressEligible(csvData: string, address: string): boolean {
  const snapshot = parseAirdropCsv(csvData);
  return snapshot.some(
    (entry) => entry.recipient.toLowerCase() === address.toLowerCase(),
  );
}

export function getAmountForAddress(csvData: string, address: string): number {
  const snapshot = parseAirdropCsv(csvData);
  const entry = snapshot.find(
    (e) => e.recipient.toLowerCase() === address.toLowerCase(),
  );
  return entry?.amount ?? 0;
}

/**
 * Shared types and expiry logic for optimistic "pending log" cards.
 * Platform stores (Zustand on web, external store on mobile) use these shapes.
 */

/** Failsafe expiry for logs that never index. Keep generous — real cards are
 *  removed when the on-chain row appears (dedup by imageUri). */
export const PENDING_DOG_EXPIRY_MS = 10 * 60 * 1000;

export interface PendingDogBase {
  transactionId: string;
  logId: string;
  imageUri: string;
  eater: string;
  logger: string;
  timestamp: string;
  chainId: string;
  isPending: true;
  createdAt: number;
}

/** Web store includes metadataUri + zoraCoin for richer optimistic cards. */
export interface PendingDogEvent extends PendingDogBase {
  metadataUri: string;
  zoraCoin: string;
}

export function isPendingDogExpired(
  dog: Pick<PendingDogBase, "createdAt">,
  now = Date.now(),
): boolean {
  return now - dog.createdAt >= PENDING_DOG_EXPIRY_MS;
}

export function filterExpiredPendingDogs<T extends PendingDogBase>(
  dogs: T[],
  now = Date.now(),
): T[] {
  return dogs.filter((d) => !isPendingDogExpired(d, now));
}

import { useMemo, useSyncExternalStore } from "react";

export interface PendingDog {
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

// Failsafe expiry for logs that never index. The feed removes a pending card the
// moment its real on-chain row appears (dedup by imageUri), so this only needs
// to catch stuck/failed txs — keep it generous.
const EXPIRY_MS = 10 * 60 * 1000;

let dogs: PendingDog[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/**
 * Tiny external store for optimistic "pending" dogs — the mobile counterpart to
 * the web zustand `pendingTransactions` store, without adding a dependency.
 */
export const pendingDogsStore = {
  add(dog: Omit<PendingDog, "createdAt">) {
    dogs = [
      { ...dog, createdAt: Date.now() },
      ...dogs.filter((d) => d.transactionId !== dog.transactionId),
    ];
    emit();
  },
  remove(transactionId: string) {
    const next = dogs.filter((d) => d.transactionId !== transactionId);
    if (next.length !== dogs.length) {
      dogs = next;
      emit();
    }
  },
  clearExpired() {
    const now = Date.now();
    const next = dogs.filter((d) => now - d.createdAt < EXPIRY_MS);
    if (next.length !== dogs.length) {
      dogs = next;
      emit();
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    return dogs;
  },
};

/** Subscribe to pending dogs for a chain. Stable reference while unchanged. */
export function usePendingDogs(chainId: string): PendingDog[] {
  const all = useSyncExternalStore(
    pendingDogsStore.subscribe,
    pendingDogsStore.getSnapshot,
    pendingDogsStore.getSnapshot,
  );
  return useMemo(() => all.filter((d) => d.chainId === chainId), [all, chainId]);
}

import { useMemo, useSyncExternalStore } from "react";
import {
  filterExpiredPendingDogs,
  type PendingDogBase,
} from "@shared/pending";

export type PendingDog = PendingDogBase;

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
    const next = filterExpiredPendingDogs(dogs);
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

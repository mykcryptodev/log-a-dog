import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PENDING_DOG_EXPIRY_MS,
  filterExpiredPendingDogs,
  type PendingDogEvent,
} from '@shared/pending';

export type { PendingDogEvent } from '@shared/pending';

interface PendingTransactionsStore {
  pendingDogs: PendingDogEvent[];
  addPendingDog: (dog: PendingDogEvent) => void;
  removePendingDog: (transactionId: string) => void;
  clearExpiredPending: () => void;
  getPendingDogsForChain: (chainId: string) => PendingDogEvent[];
}

export const usePendingTransactionsStore = create<PendingTransactionsStore>()(
  persist(
    (set, get) => ({
      pendingDogs: [],
      
      addPendingDog: (dog: PendingDogEvent) => {
        set((state) => ({
          pendingDogs: [
            {
              ...dog,
              createdAt: Date.now(),
            },
            ...state.pendingDogs
          ]
        }));
      },
      
      removePendingDog: (transactionId: string) => {
        set((state) => ({
          pendingDogs: state.pendingDogs.filter(dog => dog.transactionId !== transactionId)
        }));
      },
      
      clearExpiredPending: () => {
        set((state) => ({
          pendingDogs: filterExpiredPendingDogs(state.pendingDogs),
        }));
      },
      
      getPendingDogsForChain: (chainId: string) => {
        const { pendingDogs } = get();
        return pendingDogs.filter(dog => dog.chainId === chainId);
      },
    }),
    {
      name: 'pending-transactions',
    }
  )
);
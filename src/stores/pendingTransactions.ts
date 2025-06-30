import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PendingDogEvent {
  logId: string;
  imageUri: string;
  metadataUri: string;
  eater: string;
  logger: string;
  zoraCoin: string;
  timestamp: string; // Store as string to avoid BigInt serialization issues
  chainId: string;
  isPending: true;
  transactionId: string;
  createdAt: number; // timestamp when added to store
}

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
        const EXPIRY_TIME = 2 * 60 * 1000; // 2 minutes instead of 10 minutes
        const now = Date.now();
        
        set((state) => ({
          pendingDogs: state.pendingDogs.filter(dog => 
            now - dog.createdAt < EXPIRY_TIME
          )
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
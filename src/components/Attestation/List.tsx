import { useEffect, type FC, useState, useMemo, useRef } from "react";
import { api } from "~/utils/api";
import { ZERO_ADDRESS } from "thirdweb";
import { usePendingTransactionsStore, type PendingDogEvent } from "~/stores/pendingTransactions";
import HotdogCard from "~/components/utils/HotdogCard";
import { DEFAULT_CHAIN } from "~/constants";

// Types from hotdog router
type AttestationPeriod = {
  startTime: string;
  endTime: string;
  status: number;
  totalValidStake: string;
  totalInvalidStake: string;
  isValid: boolean;
};

type HotdogMetadata = {
  imageUri: string;
  eater: string;
  zoraCoin?: {
    address: string;
    name: string;
    symbol: string;
  };
};

type ZoraCoinDetails = {
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  totalVolume: string;
  volume24h?: string;
  createdAt?: string;
  creatorAddress?: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  chainId?: number;
  uniqueHolders?: number;
  mediaContent?: {
    mimeType?: string;
    originalUri?: string;
    previewImage?: {
      small?: string;
      medium?: string;
      blurhash?: string;
    };
  };
  link?: string;
};

// Type for hotdog from tRPC
type RealDogEvent = {
  logId: string;
  imageUri: string;
  metadataUri: string;
  timestamp: string;
  eater: string;
  logger: string;
  zoraCoin: ZoraCoinDetails | null;
  attestationPeriod?: AttestationPeriod;
  metadata?: HotdogMetadata | null;
  duplicateOfLogId?: string | null;
};

type HotdogItem = RealDogEvent | PendingDogEvent;

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  limit: number;
  address?: string;
};

export const ListAttestations: FC<Props> = ({ limit }) => {
  const limitOrDefault = limit ?? 4;
  const [start, setStart] = useState<number>(0);
  const isClient = typeof window !== 'undefined';
  const [isPaginating, setIsPaginating] = useState(false);
  const { getPendingDogsForChain, clearExpiredPending } = usePendingTransactionsStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const queryParams = {
    chainId: DEFAULT_CHAIN.id,
    user: ZERO_ADDRESS, // Always use zero address to get ALL hotdogs for the homepage feed
    start,
    limit: limitOrDefault,
  };

  const { data: dogData, isLoading: isLoadingHotdogs, refetch: refetchDogData } = api.hotdog.getAll.useQuery(queryParams, {
    enabled: !!DEFAULT_CHAIN.id && isClient, // Only run query on client side
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Get pending dogs for current chain
  const pendingDogs = getPendingDogsForChain(DEFAULT_CHAIN.id.toString());

  // Clear expired pending transactions more frequently
  useEffect(() => {
    // Clear immediately on mount
    clearExpiredPending();
    
    // Set up interval to clear expired pending dogs every 30 seconds
    // Only if we're on the client side
    if (isClient) {
      intervalRef.current = setInterval(() => {
        clearExpiredPending();
      }, 30000); // 30 seconds
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [clearExpiredPending, isClient]); // Remove pendingDogs.length dependency

  // Handle pagination loading state
  useEffect(() => {
    if (isLoadingHotdogs && start > 0) {
      setIsPaginating(true);
    } else {
      setIsPaginating(false);
    }
  }, [isLoadingHotdogs, start]);

  // Smart deduplication: only filter out optimistic data when real data with same logId exists
  const realLogIds = new Set(dogData?.hotdogs?.map(h => h.logId) ?? []);
  const filteredPendingDogs = pendingDogs.filter(pending => {
    const hasRealData = realLogIds.has(pending.logId);
    if (hasRealData) {
    }
    return !hasRealData;
  });

  const allHotdogs: HotdogItem[] = useMemo(() => {
    return dogData?.hotdogs ? [...filteredPendingDogs, ...dogData.hotdogs] : pendingDogs;
  }, [dogData?.hotdogs, filteredPendingDogs, pendingDogs]);

  // Mobile-safe scroll function
  const scrollToTop = () => {
    // Clear any pending scroll timeout
    if (paginationTimeoutRef.current) {
      clearTimeout(paginationTimeoutRef.current);
    }
    
    // Use a longer delay on mobile and requestAnimationFrame for smoother scrolling
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 300 : 100;
    
    paginationTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        const element = document.getElementById('top-of-list');
        if (element) {
          // Use smooth scrolling on desktop, instant on mobile to prevent conflicts
          element.scrollIntoView({ 
            behavior: isMobile ? "auto" : "smooth",
            block: "start"
          });
        }
      });
    }, delay);
  };

  // Handle pagination with loading state
  const handlePagination = (direction: 'prev' | 'next') => {
    if (isPaginating) return; // Prevent rapid pagination clicks
    
    setIsPaginating(true);
    
    if (direction === 'prev') {
      setStart((prev) => Math.max(0, prev - limitOrDefault));
    } else {
      setStart((prev) => prev + limitOrDefault);
    }
    
    scrollToTop();
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (paginationTimeoutRef.current) {
        clearTimeout(paginationTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state while client-side query is fetching
  if (isLoadingHotdogs && !isPaginating) {
    return (
      <>
        <div id="top-of-list" className="invisible" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: limitOrDefault }).map((_, index) => (
            <div className="card p-4 bg-base-200 bg-opacity-50" key={index}>
              <div className="flex gap-2 items-center">
                <div className="h-10 w-10 bg-base-300 animate-pulse rounded-full" />
                <div className="h-4 w-20 bg-base-300 animate-pulse rounded-lg" />
              </div>
              <div className="card-body p-4">
                <div className="mx-auto w-56 h-56 bg-base-300 animate-pulse rounded-lg" />
              </div>
              <div className="flex flex-row w-full items-center justify-between">
                <div className="text-xs flex items-center gap-1">
                  <div className="h-4 w-4 bg-base-300 animate-pulse rounded-full" />
                  <div className="h-4 w-8 bg-base-300 animate-pulse rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-base-300 animate-pulse rounded-full" />
                  <span className="w-16 h-4 bg-base-300 animate-pulse rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 h-4 bg-base-300 animate-pulse rounded-lg" />
                </div>
                <div className="flex justify-end items-center gap-2">
                  <div className="h-4 w-4 bg-base-300 animate-pulse rounded-full" />
                  <div className="h-4 w-4 bg-base-300 animate-pulse rounded-full" />
                </div>
              </div>
            </div>
          ))}
          <div className="join md:col-span-2 place-content-center">
            <button className="join-item btn" disabled>«</button>
            <button className="join-item btn">Page 1 of ...</button>
            <button className="join-item btn" disabled>»</button>
          </div>
        </div>
      </>
    );
  }

  // Show error state if no data after loading
  if (!dogData && !isLoadingHotdogs && isClient) {
    return (
      <>
        <div id="top-of-list" className="invisible" />
        <div className="flex flex-col gap-4 items-center justify-center py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Unable to load hotdogs</h3>
            <p className="text-sm text-base-content/70 mb-4">Please try refreshing the page</p>
            <button 
              className="btn btn-primary"
              onClick={() => void refetchDogData()}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // Create maps to ensure correct attestation data is passed by logId
  const validMap = dogData?.hotdogs && dogData.validAttestations ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.validAttestations[i]])) : {};
  const invalidMap = dogData?.hotdogs && dogData.invalidAttestations ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.invalidAttestations[i]])) : {};
  const userAttestedMap = dogData?.hotdogs && dogData.userAttested ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.userAttested[i]])) : {};
  const userAttestationMap = dogData?.hotdogs && dogData.userAttestations ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.userAttestations[i]])) : {};

  // Helper function to get attestation data for a hotdog
  const getAttestationData = (hotdog: HotdogItem): {
    validAttestations: string;
    invalidAttestations: string;
    userAttested: boolean;
    userAttestation: boolean;
  } => {
    if ('isPending' in hotdog && hotdog.isPending) {
      return {
        validAttestations: "0",
        invalidAttestations: "0", 
        userAttested: false,
        userAttestation: false,
      };
    }
    return {
      validAttestations: validMap[hotdog.logId] ?? "0",
      invalidAttestations: invalidMap[hotdog.logId] ?? "0",
      userAttested: userAttestedMap[hotdog.logId] ?? false,
      userAttestation: userAttestationMap[hotdog.logId] ?? false,
    };
  };

  return (
    <>
    <div id="top-of-list" className="invisible" />
    <div className="flex flex-col gap-4">
      {/* Show pagination loading overlay */}
      {isPaginating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-base-100 p-4 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <div className="loading loading-spinner loading-sm"></div>
              <span>Loading page...</span>
            </div>
          </div>
        </div>
      )}
      
      {allHotdogs.map((hotdog) => {
        const attestationData = getAttestationData(hotdog);
        const isPending = 'isPending' in hotdog && hotdog.isPending;
        
        return (
          <HotdogCard
            key={hotdog.logId}
            hotdog={hotdog}
            validAttestations={attestationData.validAttestations}
            invalidAttestations={attestationData.invalidAttestations}
            userAttested={attestationData.userAttested}
            userAttestation={attestationData.userAttestation}
            chainId={DEFAULT_CHAIN.id}
            onRefetch={() => void refetchDogData()}
            linkToDetail={true}
            showAiJudgement={false}
            disabled={isPending}
          />
        );
      })}
      <div className="join md:col-span-2 place-content-center">
        <button
          className="join-item btn"
          onClick={() => handlePagination('prev')}
          disabled={start === 0 || isPaginating}
        >
          {isPaginating ? <span className="loading loading-spinner loading-xs"></span> : "«"}
        </button>
        <button className="join-item btn" disabled>
          Page {(Math.floor(start / limitOrDefault) + 1)} of {dogData?.totalPages.toString() ?? '...'}
        </button>
        <button
          className="join-item btn"
          onClick={() => handlePagination('next')}
          disabled={!dogData?.hasNextPage || isPaginating}
        >
          {isPaginating ? <span className="loading loading-spinner loading-xs"></span> : "»"}
        </button>
      </div>
    </div>
    </>
  );
}
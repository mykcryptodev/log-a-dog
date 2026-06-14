import { useEffect, type FC, useState, useMemo, useRef, useCallback } from "react";
import { toast } from "react-toastify";
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
    onSettled: () => setIsPaginating(false),
  });

  // Manual "Refresh feed" — pulls any new on-chain logs into the DB then refetches.
  // Backend enforces a per-user cooldown; we surface that as a toast.
  const { mutateAsync: refreshFeed, isLoading: isRefreshing } =
    api.indexer.refreshFeed.useMutation();

  const handleRefresh = async () => {
    if (isRefreshing) return;
    try {
      await refreshFeed({ chainId: DEFAULT_CHAIN.id });
      await refetchDogData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not refresh right now.";
      toast.info(message);
    }
  };

  // Get pending dogs for current chain
  const pendingDogs = getPendingDogsForChain(DEFAULT_CHAIN.id.toString());

  // Clear expired pending transactions more frequently
  useEffect(() => {
    // Clear immediately on mount
    clearExpiredPending();

    // Set up interval to clear expired pending dogs every 30 seconds
    if (isClient) {
      intervalRef.current = setInterval(() => {
        clearExpiredPending();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (paginationTimeoutRef.current) {
        clearTimeout(paginationTimeoutRef.current);
      }
    };
  }, [clearExpiredPending, isClient]);

  // Smart deduplication: only filter out optimistic data when real data with same logId exists
  const filteredPendingDogs = useMemo(() => {
    const realLogIds = new Set(dogData?.hotdogs?.map(h => h.logId) ?? []);
    return pendingDogs.filter(pending => {
      const hasRealData = realLogIds.has(pending.logId);
      return !hasRealData;
    });
  }, [dogData?.hotdogs, pendingDogs]);

  const allHotdogs: HotdogItem[] = useMemo(() => {
    return dogData?.hotdogs ? [...filteredPendingDogs, ...dogData.hotdogs] : pendingDogs;
  }, [dogData?.hotdogs, filteredPendingDogs, pendingDogs]);

  // Stable callback so every memoized <HotdogCard> doesn't re-render when this
  // list re-renders (e.g. the 30s expired-pending interval). `refetchDogData`
  // from react-query is itself stable. See React rule `rerender-memo`.
  const handleRefetch = useCallback(() => void refetchDogData(), [refetchDogData]);

  // Build logId -> attestation lookup maps once per data change instead of on
  // every render (the list re-renders on a 30s interval). See `js-index-maps`.
  const attestationMaps = useMemo(() => {
    const hotdogs = dogData?.hotdogs;
    if (!hotdogs) {
      return {
        validMap: {} as Record<string, string>,
        invalidMap: {} as Record<string, string>,
        userAttestedMap: {} as Record<string, boolean>,
        userAttestationMap: {} as Record<string, boolean>,
      };
    }
    return {
      validMap: Object.fromEntries(hotdogs.map((h, i) => [h.logId, dogData.validAttestations?.[i]])) as Record<string, string>,
      invalidMap: Object.fromEntries(hotdogs.map((h, i) => [h.logId, dogData.invalidAttestations?.[i]])) as Record<string, string>,
      userAttestedMap: Object.fromEntries(hotdogs.map((h, i) => [h.logId, dogData.userAttested?.[i]])) as Record<string, boolean>,
      userAttestationMap: Object.fromEntries(hotdogs.map((h, i) => [h.logId, dogData.userAttestations?.[i]])) as Record<string, boolean>,
    };
  }, [dogData]);

  // Helper to get attestation data for a hotdog. Stable across renders so it
  // doesn't defeat the memoization above.
  const getAttestationData = useCallback((hotdog: HotdogItem): {
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
      validAttestations: attestationMaps.validMap[hotdog.logId] ?? "0",
      invalidAttestations: attestationMaps.invalidMap[hotdog.logId] ?? "0",
      userAttested: attestationMaps.userAttestedMap[hotdog.logId] ?? false,
      userAttestation: attestationMaps.userAttestationMap[hotdog.logId] ?? false,
    };
  }, [attestationMaps]);

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




  // Show loading state while client-side query is fetching — grill-mark shimmer
  // skeleton cards (REDESIGN §4 States).
  if (isLoadingHotdogs && !isPaginating) {
    return (
      <>
        <div id="top-of-list" className="invisible" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: limitOrDefault }).map((_, index) => (
            <div className="card overflow-hidden rounded-3xl bg-base-200 p-4 shadow-dog" key={index}>
              <div className="flex items-center gap-2">
                <div className="grill-skeleton h-10 w-10 animate-grill-shimmer rounded-full" />
                <div className="grill-skeleton h-4 w-24 animate-grill-shimmer rounded-lg" />
              </div>
              <div className="grill-skeleton mt-3 aspect-[4/5] w-full animate-grill-shimmer rounded-2xl" />
              <div className="mt-3 flex gap-2">
                <div className="grill-skeleton h-10 flex-1 animate-grill-shimmer rounded-xl" />
                <div className="grill-skeleton h-10 flex-1 animate-grill-shimmer rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Show error state if no data after loading
  if (!dogData && !isLoadingHotdogs && isClient) {
    return (
      <>
        <div id="top-of-list" className="invisible" />
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <span className="text-5xl">🧊</span>
          <h3 className="font-display text-2xl tracking-wide">The grill went cold.</h3>
          <p className="text-sm text-base-content/70">Couldn&apos;t load the dogs.</p>
          <button className="btn btn-primary font-display tracking-wide" onClick={() => void refetchDogData()}>
            Retry
          </button>
        </div>
      </>
    );
  }

  // Empty feed — be the first to log.
  if (isClient && !isLoadingHotdogs && allHotdogs.length === 0) {
    return (
      <>
        <div id="top-of-list" className="invisible" />
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <span className="text-6xl">🌭</span>
          <h3 className="font-display text-2xl tracking-wide">No dogs yet today.</h3>
          <p className="text-sm text-base-content/70">The grill is hot. 🔥 Be the first to log.</p>
          <button
            className="btn btn-primary font-display tracking-wide"
            onClick={() =>
              (document.getElementById("create_attestation_modal") as HTMLDialogElement | null)?.showModal()
            }
          >
            Log a Dog
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div id="top-of-list" className="invisible" />
      <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          className="btn btn-ghost btn-sm gap-2"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          title="Not seeing your dog? Pull the latest logs from the chain."
        >
          {isRefreshing ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <span>↻</span>
          )}
          Refresh feed
        </button>
      </div>
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
            onRefetch={handleRefetch}
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
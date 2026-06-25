import { useEffect, type FC, useMemo, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { api } from "~/utils/api";
import { ZERO_ADDRESS } from "thirdweb";
import { usePendingTransactionsStore, type PendingDogEvent } from "~/stores/pendingTransactions";
import HotdogCard from "~/components/utils/HotdogCard";
import { BackToTopButton } from "~/components/utils/BackToTopButton";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
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
  const isClient = typeof window !== 'undefined';
  const { getPendingDogsForChain, clearExpiredPending, removePendingDog } = usePendingTransactionsStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);


  const queryParams = {
    chainId: DEFAULT_CHAIN.id,
    user: ZERO_ADDRESS, // Always use zero address to get ALL hotdogs for the homepage feed
    limit: limitOrDefault,
  };

  const {
    data: dogData,
    isLoading: isLoadingHotdogs,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchDogData,
  } = api.hotdog.getAll.useInfiniteQuery(queryParams, {
    enabled: !!DEFAULT_CHAIN.id && isClient, // Only run query on client side
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
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
    };
  }, [clearExpiredPending, isClient]);

  useEffect(() => {
    if (!isClient) return;

    const loadMoreTarget = loadMoreRef.current;
    if (!loadMoreTarget) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(loadMoreTarget);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isClient, isFetchingNextPage]);

  const loadedHotdogs = useMemo(() => {
    return dogData?.pages.flatMap((page) => page.hotdogs) ?? [];
  }, [dogData?.pages]);

  // Match optimistic cards to real rows by imageUri, not the temporary logId.
  // The optimistic logId is the tx id (a "weird id") which never equals the real
  // on-chain numeric logId, so a logId-based match never fired and the card only
  // disappeared via a timer/explicit removal — causing the jarring gap. imageUri
  // is byte-identical across the round-trip (raw ipfs:// upload → on-chain arg →
  // DB → getAll), so it's a reliable key.
  const realImageUris = useMemo(
    () => new Set(loadedHotdogs.map(h => h.imageUri)),
    [loadedHotdogs],
  );

  // Raw pending imageUris (before dedup) — used to spot a real row that just
  // replaced an optimistic card so we can suppress its entrance animation.
  const pendingImageUris = useMemo(
    () => new Set(pendingDogs.map((p: PendingDogEvent) => p.imageUri)),
    [pendingDogs],
  );

  // Smart deduplication: drop an optimistic card the moment its real row appears.
  const filteredPendingDogs = useMemo(() => {
    return pendingDogs.filter((pending: PendingDogEvent) => !realImageUris.has(pending.imageUri));
  }, [pendingDogs, realImageUris]);

  // Infer the next on-chain logId so the optimistic card shows "#<next>" instead
  // of the tx id. max(loaded)+1 doesn't exist yet, so any logId-driven child
  // query returns empty (no wrong data) and it self-corrects when the real row
  // lands. Display only — never used as a React key or for navigation.
  const nextLogIdBase = useMemo(() => {
    let max = 0n;
    for (const h of loadedHotdogs) {
      try {
        const id = BigInt(h.logId);
        if (id > max) max = id;
      } catch {
        // non-numeric (shouldn't happen for real rows) — skip
      }
    }
    return max;
  }, [loadedHotdogs]);

  // Optimistic cards rendered newest-first; give the newest the highest inferred id.
  const displayPendingDogs = useMemo(() => {
    const len = filteredPendingDogs.length;
    return filteredPendingDogs.map((pending: PendingDogEvent, i: number) => ({
      ...pending,
      logId: (nextLogIdBase + BigInt(len - i)).toString(),
    }));
  }, [filteredPendingDogs, nextLogIdBase]);

  const allHotdogs: HotdogItem[] = useMemo(() => {
    return loadedHotdogs.length > 0 ? [...displayPendingDogs, ...loadedHotdogs] : displayPendingDogs;
  }, [displayPendingDogs, loadedHotdogs]);

  // Remove an optimistic entry from the store once its real row is present. This
  // tracks reality (the dedup above is the *visual* removal); the 30s expiry
  // sweep stays only as a failsafe for txs that never index.
  useEffect(() => {
    if (loadedHotdogs.length === 0) return;
    pendingDogs.forEach((pending: PendingDogEvent) => {
      if (realImageUris.has(pending.imageUri)) {
        removePendingDog(pending.transactionId);
      }
    });
  }, [realImageUris, pendingDogs, removePendingDog, loadedHotdogs.length]);

  // Stable callback so every memoized <HotdogCard> doesn't re-render when this
  // list re-renders (e.g. the 30s expired-pending interval). `refetchDogData`
  // from react-query is itself stable. See React rule `rerender-memo`.
  const handleRefetch = useCallback(() => void refetchDogData(), [refetchDogData]);

  // Build logId -> attestation lookup maps once per data change instead of on
  // every render (the list re-renders on a 30s interval). See `js-index-maps`.
  const attestationMaps = useMemo(() => {
    const pages = dogData?.pages;
    if (!pages) {
      return {
        validMap: {} as Record<string, string>,
        invalidMap: {} as Record<string, string>,
        userAttestedMap: {} as Record<string, boolean>,
        userAttestationMap: {} as Record<string, boolean>,
      };
    }

    const validMap: Record<string, string> = {};
    const invalidMap: Record<string, string> = {};
    const userAttestedMap: Record<string, boolean> = {};
    const userAttestationMap: Record<string, boolean> = {};

    pages.forEach((page) => {
      page.hotdogs.forEach((hotdog, index) => {
        validMap[hotdog.logId] = page.validAttestations?.[index] ?? "0";
        invalidMap[hotdog.logId] = page.invalidAttestations?.[index] ?? "0";
        userAttestedMap[hotdog.logId] = page.userAttested?.[index] ?? false;
        userAttestationMap[hotdog.logId] = page.userAttestations?.[index] ?? false;
      });
    });

    return {
      validMap,
      invalidMap,
      userAttestedMap,
      userAttestationMap,
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

  // Show loading state while client-side query is fetching — grill-mark shimmer
  // skeleton cards (REDESIGN §4 States).
  if (isLoadingHotdogs) {
    return (
      <>
        <div id="top-of-list" className="invisible" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: limitOrDefault }).map((_, index) => (
            <div className="card pop-card overflow-hidden rounded-[1.75rem] bg-base-100 p-4" key={index}>
       
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
      <BackToTopButton />
      <div id="top-of-list" className="invisible" />
      <div className="flex flex-col gap-4">
      {/* Live scoreboard ticker — always shows all-time top dogs */}
      <div className="pop-card w-full overflow-hidden rounded-2xl bg-base-100">
        <LeaderboardBanner scrollSpeed={40} />
      </div>
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
      {allHotdogs.map((hotdog) => {
        const attestationData = getAttestationData(hotdog);
        const isPending = 'isPending' in hotdog && hotdog.isPending;
        // A real row whose imageUri is still in the pending store is one that
        // just replaced an optimistic card. Render it without the drop-in
        // entrance animation so it settles in place instead of looking like a
        // second card dropping in. Keys stay unique (tx id for pending, logId
        // for real) to avoid collisions on duplicate images / concurrent logs.
        const justLanded = !isPending && pendingImageUris.has(hotdog.imageUri);
        const key = isPending
          ? `pending-${hotdog.transactionId}`
          : hotdog.logId;

        return (
          <HotdogCard
            key={key}
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
            animateEntrance={!justLanded}
          />
        );
      })}
      <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <span className="loading loading-spinner loading-sm" />
            <span>Loading more dogs...</span>
          </div>
        ) : !hasNextPage ? (
          <p className="text-sm text-base-content/60">You&apos;ve reached the end of the grill.</p>
        ) : null}
      </div>
    </div>
    </>
  );
}
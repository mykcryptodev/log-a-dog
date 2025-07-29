import { useEffect, type FC, useState, useMemo, useRef, useCallback } from "react";
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
  eaterProfile?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
  } | null;
  loggerProfile?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
  } | null;
};

type HotdogItem = RealDogEvent | PendingDogEvent;

const isRealDogEvent = (dog: HotdogItem): dog is RealDogEvent => {
  return !("isPending" in dog && dog.isPending);
};

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  limit: number;
  address?: string;
  includeSpammers?: boolean; // when false, filter out known spammer logs
};

export const ListAttestations: FC<Props> = ({ limit, includeSpammers = true }) => {
  const limitOrDefault = limit ?? 4;
  const [start, setStart] = useState<number>(0);
  const isClient = typeof window !== 'undefined';
  const { getPendingDogsForChain, clearExpiredPending } = usePendingTransactionsStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);


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
    keepPreviousData: true,
  });

  const [loadedHotdogs, setLoadedHotdogs] = useState<RealDogEvent[]>([]);
  const [validMap, setValidMap] = useState<Record<string, string>>({});
  const [invalidMap, setInvalidMap] = useState<Record<string, string>>({});
  const [userAttestedMap, setUserAttestedMap] = useState<Record<string, boolean>>({});
  const [userAttestationMap, setUserAttestationMap] = useState<Record<string, boolean>>({});
  const [hasNextPage, setHasNextPage] = useState(true);

  // Append newly fetched data
  useEffect(() => {
    if (!dogData) return;
    setHasNextPage(dogData.hasNextPage);
    setLoadedHotdogs((prev) => [...prev, ...dogData.hotdogs]);

    const newValid: Record<string, string> = {};
    const newInvalid: Record<string, string> = {};
    const newUserAttested: Record<string, boolean> = {};
    const newUserAttestation: Record<string, boolean> = {};
    dogData.hotdogs.forEach((h, i) => {
      newValid[h.logId] = dogData.validAttestations[i];
      newInvalid[h.logId] = dogData.invalidAttestations[i];
      newUserAttested[h.logId] = dogData.userAttested[i];
      newUserAttestation[h.logId] = dogData.userAttestations[i];
    });
    setValidMap((prev) => ({ ...prev, ...newValid }));
    setInvalidMap((prev) => ({ ...prev, ...newInvalid }));
    setUserAttestedMap((prev) => ({ ...prev, ...newUserAttested }));
    setUserAttestationMap((prev) => ({ ...prev, ...newUserAttestation }));
  }, [dogData]);

  // Reset when filtering mode changes
  useEffect(() => {
    setStart(0);
    setLoadedHotdogs([]);
    setValidMap({});
    setInvalidMap({});
    setUserAttestedMap({});
    setUserAttestationMap({});
    setHasNextPage(true);
  }, [includeSpammers]);


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
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [clearExpiredPending, isClient]);

  // Smart deduplication: only filter out optimistic data when real data with same logId exists
  const filteredPendingDogs = useMemo(() => {
    const realLogIds = new Set(loadedHotdogs.map(h => h.logId));
    return pendingDogs.filter(pending => !realLogIds.has(pending.logId));
  }, [loadedHotdogs, pendingDogs]);

  const allHotdogs: HotdogItem[] = useMemo(() => {
    return [...filteredPendingDogs, ...loadedHotdogs];
  }, [filteredPendingDogs, loadedHotdogs]);

  const displayHotdogs: HotdogItem[] = useMemo(() => {
    if (includeSpammers) return allHotdogs;
    return allHotdogs.filter((hotdog) => {
      if (!isRealDogEvent(hotdog)) return true;
      const eaterSpam = hotdog.eaterProfile?.isKnownSpammer;
      const loggerSpam = hotdog.loggerProfile?.isKnownSpammer;
      return !eaterSpam && !loggerSpam;
    });
  }, [allHotdogs, includeSpammers]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isLoadingHotdogs) {
          setStart((prev) => prev + limitOrDefault);
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasNextPage, isLoadingHotdogs, limitOrDefault],
  );




  // Show loading state while client-side query is fetching
  if (isLoadingHotdogs && loadedHotdogs.length === 0) {
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

  // The attestation maps are built incrementally as pages load

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
      
      {displayHotdogs.map((hotdog) => {
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
      <div ref={lastElementRef} />
      {isLoadingHotdogs && loadedHotdogs.length > 0 && (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      )}
    </div>
    </>
  );
}
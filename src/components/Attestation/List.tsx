/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, type FC, useState, useMemo, useRef } from "react";
import Link from "next/link";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import HotdogImage from "~/components/utils/HotdogImage";
import { CurrencyDollarIcon, FireIcon } from "@heroicons/react/24/outline";
import { Avatar } from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import { ZERO_ADDRESS } from "thirdweb";
import JudgeAttestation from "~/components/Attestation/Judge";
import Revoke from "~/components/Attestation/Revoke";
import VotingCountdown from "./VotingCountdown";
import Comments from "~/components/Attestation/Comments";
import { env } from "~/env";
import { isAddressEqual } from "viem";
import { formatAbbreviatedFiat } from "~/helpers/formatFiat";
import AttestationStatusBadge from "~/components/Attestation/AttestationStatusBadge";
import { usePendingTransactionsStore, type PendingDogEvent } from "~/stores/pendingTransactions";

import { ATTESTATION_WINDOW_SECONDS, MAKER_WALLET } from "~/constants";

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
  volume24h: string;
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
};

type HotdogItem = RealDogEvent | PendingDogEvent;

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp?: number;
  limit: number;
  address?: string;
};

export const ListAttestations: FC<Props> = ({ limit }) => {
  const limitOrDefault = limit ?? 4;
  const { activeChain } = useContext(ActiveChainContext);
  const [start, setStart] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const { getPendingDogsForChain, clearExpiredPending } = usePendingTransactionsStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fix hydration mismatch by only rendering dynamic content on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const queryParams = {
    chainId: activeChain.id,
    user: ZERO_ADDRESS, // Always use zero address to get ALL hotdogs for the homepage feed
    start,
    limit: limitOrDefault,
  };

  const { data: dogData, isLoading: isLoadingHotdogs, refetch: refetchDogData } = api.hotdog.getAll.useQuery(queryParams, {
    enabled: !!activeChain.id && isClient, // Only run query on client side
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Get pending dogs for current chain
  const pendingDogs = getPendingDogsForChain(activeChain.id.toString());

  // Clear expired pending transactions more frequently
  useEffect(() => {
    // Clear immediately on mount
    clearExpiredPending();
    
    // Only set up interval if we have pending dogs
    if (pendingDogs.length > 0) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set up interval to clear expired pending dogs every 30 seconds
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
  }, [clearExpiredPending, pendingDogs.length]);

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
      console.log(`🔄 Filtering out optimistic dog ${pending.logId} - real data found`);
    }
    return !hasRealData;
  });
  const allHotdogs: HotdogItem[] = useMemo(() => 
    dogData?.hotdogs ? [...filteredPendingDogs, ...dogData.hotdogs] : pendingDogs,
    [dogData?.hotdogs, filteredPendingDogs, pendingDogs]
  );

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

  const showLoggedVia = (hotdog: { eater: string, logger: string }) => {
    const loggerIsNotEater = !isAddressEqual(
      hotdog.eater as `0x${string}`,
      hotdog.logger as `0x${string}`,
    );
    const loggerIsNotBackendWallet = !isAddressEqual(
      hotdog.logger as `0x${string}`,
      env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`,
    );
    const loggerIsNotMakerWallet = !isAddressEqual(
      hotdog.logger as `0x${string}`,
      MAKER_WALLET,
    );
    return loggerIsNotEater && loggerIsNotBackendWallet && loggerIsNotMakerWallet;
  };

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
        const isExpired =
          Number(hotdog.timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000 <= Date.now();
        const attestationData = getAttestationData(hotdog);
        const isPending = 'isPending' in hotdog && hotdog.isPending;
        return (
          <div className="card bg-base-200 bg-opacity-25 backdrop-blur-sm shadow" key={hotdog.logId}>
            <div className="card-body p-4 max-w-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 w-fit">
                    <Avatar address={hotdog.eater} fallbackSize={24} />
                    <Name address={hotdog.eater} />
                  </div>
                  <div className="flex flex-col">
                    {showLoggedVia({ eater: hotdog.eater, logger: hotdog.logger }) && (
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        <span>via</span>
                        <Avatar address={hotdog.logger} size="16px" />
                        <Name address={hotdog.logger} />
                      </div>
                    )}
                  </div>
                </div>
                <Revoke 
                  hotdog={hotdog} 
                  onRevocation={refetchDogData}
                />
              </div>
              {('zoraCoin' in hotdog && hotdog.zoraCoin && typeof hotdog.zoraCoin === 'object' && hotdog.zoraCoin.marketCap) && (
                <div className="flex items-center text-xs opacity-50 w-full justify-between">
                  <div className="flex items-center gap-0.5"><CurrencyDollarIcon className="w-4 h-4" /> MCAP ${formatAbbreviatedFiat(Number(hotdog.zoraCoin.marketCap))}</div>
                  <div className="flex items-center gap-0.5"><FireIcon className="w-4 h-4" /> 24H VOL ${formatAbbreviatedFiat(Number(hotdog.zoraCoin.volume24h))}</div>
                </div>
              )}
              {hotdog.zoraCoin && typeof hotdog.zoraCoin === 'object' && hotdog.zoraCoin.link && (
                <div className="text-xs opacity-50 mt-1">
                  <Link href={hotdog.zoraCoin.link} target="_blank" rel="noopener noreferrer" className="underline">
                    View coin on Zora
                  </Link>
                </div>
              )}
              <Link href={`/dog/${hotdog.logId}`}
                className="w-fit">
                <HotdogImage
                  src={hotdog.imageUri}
                  zoraCoin={hotdog.zoraCoin}
                  className="rounded-lg"
                  width="400"
                  height="400"
                />
              </Link>
              <div className="opacity-50 flex flex-row w-full items-center justify-between">
                <div className="text-xs flex items-center gap-1">
                  {('attestationPeriod' in hotdog && hotdog.attestationPeriod) && (
                    <AttestationStatusBadge attestationPeriod={hotdog.attestationPeriod} />
                  )}
                </div>
                <div className="flex justify-end items-center gap-2 text-xs">
                  {/* Temporarily disabled AI verification feature */}
                  {/* <AiJudgement 
                    logId={hotdog.logId.toString()}
                    timestamp={hotdog.timestamp.toString()}
                  /> */}
                </div>
                <div className="flex justify-end items-center gap-1">
                  <Comments
                    logId={hotdog.logId?.toString() ?? ''}
                    metadataUri={hotdog.metadataUri}
                  />
                  {!isExpired && (
                    <JudgeAttestation
                      disabled={isPending}
                      userAttested={attestationData.userAttested}
                      userAttestation={attestationData.userAttestation}
                      validAttestations={attestationData.validAttestations}
                      invalidAttestations={attestationData.invalidAttestations}
                      logId={hotdog.logId}
                      chainId={activeChain.id}
                      onAttestationMade={() => void refetchDogData()}
                      onAttestationAffirmationRevoked={() => void refetchDogData()}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full justify-end pr-2 opacity-50 text-xs">
                <VotingCountdown
                  timestamp={hotdog.timestamp.toString()}
                  logId={hotdog.logId?.toString() ?? ''}
                  validAttestations={attestationData.validAttestations}
                  invalidAttestations={attestationData.invalidAttestations}
                  onResolutionComplete={() => void refetchDogData()}
                  attestationPeriod={'attestationPeriod' in hotdog ? hotdog.attestationPeriod : undefined}
                />
              </div>
            </div>
          </div>
        )
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
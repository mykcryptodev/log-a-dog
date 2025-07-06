/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, type FC, useState, useMemo, memo } from "react";
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

import { ATTESTATION_WINDOW_SECONDS } from "~/constants";

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
  limit: number;
  address?: string;
};

const ListAttestationsComponent: FC<Props> = ({ limit }) => {
  const limitOrDefault = limit ?? 4;
  const { activeChain } = useContext(ActiveChainContext);
  const [start, setStart] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);
  const { getPendingDogsForChain, clearExpiredPending } = usePendingTransactionsStore();

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
  });

  // Get pending dogs for current chain
  const pendingDogs = getPendingDogsForChain(activeChain.id.toString());

  // Debug logging
  useEffect(() => {
    console.log('📊 List component data state:', {
      isLoading: isLoadingHotdogs,
      hasData: !!dogData,
      hotdogsCount: dogData?.hotdogs?.length ?? 0,
      pendingCount: pendingDogs.length,
      realLogIds: dogData?.hotdogs?.map(h => h.logId) ?? [],
      pendingLogIds: pendingDogs.map(p => p.logId),
    });
  }, [isLoadingHotdogs, dogData, pendingDogs]);

  // Clear expired pending transactions more frequently
  useEffect(() => {
    clearExpiredPending();
    
    // Set up interval to clear expired pending dogs every 30 seconds
    const interval = setInterval(() => {
      clearExpiredPending();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [clearExpiredPending]);

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

  // Debug the rendering data
  useEffect(() => {
    console.log('🎯 Rendering data:', {
      allHotdogsCount: allHotdogs.length,
      allHotdogsLogIds: allHotdogs.map(h => h.logId),
      filteredPendingCount: filteredPendingDogs.length,
      realHotdogsCount: dogData?.hotdogs?.length ?? 0,
      isLoadingOrNoData: isLoadingHotdogs || !dogData,
    });
  }, [allHotdogs, filteredPendingDogs, dogData, isLoadingHotdogs]);

  // Show loading state while client-side query is fetching
  if (isLoadingHotdogs || !dogData) {
    console.log('🔄 Showing loading state:', { isLoadingHotdogs, dogData: !!dogData });
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

  const showLoggedVia = (hotdog: { eater: string, logger: string }) => {
    const loggerIsNotEater = !isAddressEqual(hotdog.eater as `0x${string}`, hotdog.logger as `0x${string}`);
    const loggerIsNotBackendWallet = !isAddressEqual(hotdog.logger as `0x${string}`, env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`);
    return loggerIsNotEater && loggerIsNotBackendWallet;
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
      {allHotdogs.map((hotdog) => {
        console.log('🌭 Rendering hotdog:', hotdog.logId, { isPending: 'isPending' in hotdog && hotdog.isPending });
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
              <HotdogImage
                src={hotdog.imageUri}
                zoraCoin={hotdog.zoraCoin}
                className="rounded-lg"
                width="400"
                height="400"
              />
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
                    logId={hotdog.logId.toString()}
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
                  logId={hotdog.logId.toString()}
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
          onClick={() => {
            setStart((prev) => prev - limitOrDefault);
            // scroll to top of list
            setTimeout(
              () => document.getElementById('top-of-list')?.scrollIntoView({ behavior: "instant" }),
              100
            );
          }}
          disabled={start === 0}
        >
          «
        </button>
        <button className="join-item btn">
          Page {(Math.floor(start / limitOrDefault) + 1)} of {dogData?.totalPages.toString() ?? '...'}
        </button>
        <button
          className="join-item btn"
          onClick={() => {
            setStart((prev) => prev + limitOrDefault);
            // scroll to top of list
            setTimeout(
              () => document.getElementById('top-of-list')?.scrollIntoView({ behavior: "instant" }),
              100
            );
          }}
          disabled={!dogData?.hasNextPage}
        >
          »
        </button>
      </div>
    </div>
    </>
  );
};

export const ListAttestations = memo(ListAttestationsComponent);

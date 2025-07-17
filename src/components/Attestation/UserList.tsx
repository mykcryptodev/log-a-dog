import { useContext, useEffect, type FC, useState, useRef } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { useActiveAccount } from "thirdweb/react";
import HotdogImage from "~/components/utils/HotdogImage";
import { TagIcon } from "@heroicons/react/24/outline";
import { Avatar } from "~/components/Profile/Avatar";
import { Name } from "~/components/Profile/Name";
import JudgeAttestation from "~/components/Attestation/Judge";
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "~/components/Attestation/AiJudgement";
import VotingCountdown from "./VotingCountdown";

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp?: number;
  limit: number;
  user: string;
};

export const UserListAttestations: FC<Props> = ({ user, limit }) => {
  const limitOrDefault = limit ?? 4;
  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const [start, setStart] = useState<number>(0);
  const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: dogData, isLoading: isLoadingHotdogs, refetch: refetchDogData } = api.hotdog.getAllForUser.useQuery({
    chainId: activeChain.id,
    user,
    limit: limitOrDefault,
  }, {
    enabled: !!activeChain.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  console.log({ dogData })

  useEffect(() => {
    if (!account) return;
    void refetchDogData();
  }, [account, refetchDogData]);

  // Derive pagination loading state instead of using useEffect
  const isPaginatingDerived = isLoadingHotdogs && start > 0;

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
        // Scroll to top of the user list
        window.scrollTo({ 
          top: 0, 
          behavior: isMobile ? "auto" : "smooth" 
        });
      });
    }, delay);
  };

  // Handle pagination with loading state
  const handlePagination = (direction: 'prev' | 'next') => {
    if (isPaginatingDerived) return; // Prevent pagination during loading
    
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

  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-4 relative">
      {/* Show pagination loading overlay */}
      {isPaginatingDerived && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-base-100 p-4 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <div className="loading loading-spinner loading-sm"></div>
              <span>Loading page...</span>
            </div>
          </div>
        </div>
      )}
      
      {isLoadingHotdogs && !isPaginatingDerived && 
        Array.from({ length: limitOrDefault }).map((_, index) => (
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
        ))
      }
      {dogData?.hotdogs.map((hotdog, index) => {
        const validAttestations = dogData?.validAttestations[index];
        const invalidAttestations = dogData?.invalidAttestations[index];

        return (
          <div className="card bg-base-200 bg-opacity-50" key={`${hotdog.logId}-${index}`}>
            <div className="card-body p-4 max-w-xs">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Avatar address={hotdog.eater} />
                  <Name address={hotdog.eater} />
                </div>
                <Revoke 
                  hotdog={{ 
                    logId: hotdog.logId.toString(),
                    eater: hotdog.eater
                  }} 
                  onRevocation={refetchDogData}
                />
              </div>
              <HotdogImage
                src={hotdog.imageUri}
                zoraCoin={hotdog.zoraCoin}
                className="rounded-lg"
                width="100%"
                height="100%"
              />
              <div className="opacity-50 flex flex-row w-full items-center justify-between">
                <div className="text-xs flex items-center gap-1">
                  <TagIcon className="w-4 h-4" />
                  {hotdog.logId.toString()}
                </div>
                <div className="flex justify-end items-center gap-2 text-xs">
                  <AiJudgement 
                    logId={hotdog.logId.toString()}
                    timestamp={hotdog.timestamp.toString()}
                  />
                </div>
                <div className="flex justify-end items-center gap-2">
                  <VotingCountdown 
                    timestamp={hotdog.timestamp.toString()} 
                    logId={hotdog.logId.toString()}
                    validAttestations={validAttestations?.toString() ?? "0"}
                    invalidAttestations={invalidAttestations?.toString() ?? "0"}
                    onResolutionComplete={() => void refetchDogData()}
                    attestationPeriod={undefined}
                  />
                  <JudgeAttestation
                    disabled
                    userAttested={undefined}
                    userAttestation={undefined}
                    validAttestations={validAttestations?.toString() ?? "0"}
                    invalidAttestations={invalidAttestations?.toString() ?? "0"}
                    logId={hotdog.logId.toString()}
                    chainId={activeChain.id}
                    onAttestationMade={() => void refetchDogData()}
                    onAttestationAffirmationRevoked={() => void refetchDogData()}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div className="join md:col-span-2 place-content-center">
        <button
          className="join-item btn"
          onClick={() => handlePagination('prev')}
          disabled={start === 0 || isPaginatingDerived}
        >
          {isPaginatingDerived ? <span className="loading loading-spinner loading-xs"></span> : "«"}
        </button>
        <button className="join-item btn" disabled>
          Page {(Math.floor(start / limitOrDefault) + 1)} of {dogData?.totalPages.toString() ?? '...'}
        </button>
        <button
          className="join-item btn"
          onClick={() => handlePagination('next')}
          disabled={!dogData?.hasNextPage || isPaginatingDerived}
        >
          {isPaginatingDerived ? <span className="loading loading-spinner loading-xs"></span> : "»"}
        </button>
      </div>
    </div>
  );
}
import { useEffect, type FC, useMemo, useRef } from "react";
import { api } from "~/utils/api";
import { useActiveAccount } from "thirdweb/react";
import HotdogImage from "~/components/utils/HotdogImage";
import { TagIcon } from "@heroicons/react/24/outline";
import { Avatar } from "~/components/Profile/Avatar";
// Removed Name import - using backend profile data instead
import JudgeAttestation from "~/components/Attestation/Judge";
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "~/components/Attestation/AiJudgement";
import VotingCountdown from "./VotingCountdown";
import { DEFAULT_CHAIN } from "~/constants";

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  limit: number;
  user: string;
};

export const UserListAttestations: FC<Props> = ({ user, limit }) => {
  const limitOrDefault = limit ?? 4;
  const account = useActiveAccount();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastAccountRef = useRef<string | undefined>(undefined);

  const {
    data: dogData,
    isLoading: isLoadingHotdogs,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchDogData,
  } = api.hotdog.getAllForUser.useInfiniteQuery({
      chainId: DEFAULT_CHAIN.id,
      user,
      limit: limitOrDefault,
    }, {
      enabled: !!DEFAULT_CHAIN.id && !!user,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });


  useEffect(() => {
    if (account?.address && account.address !== lastAccountRef.current) {
      lastAccountRef.current = account.address;
      void refetchDogData();
    }
  }, [account?.address, refetchDogData]);

  useEffect(() => {
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const loadedHotdogs = useMemo(() => {
    return dogData?.pages.flatMap((page) =>
      page.hotdogs.map((hotdog, index) => ({
        hotdog,
        validAttestations: page.validAttestations[index],
        invalidAttestations: page.invalidAttestations[index],
      }))
    ) ?? [];
  }, [dogData?.pages]);

  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-4 relative">
      {isLoadingHotdogs && 
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
      {loadedHotdogs.map(({ hotdog, validAttestations, invalidAttestations }, index) => {
        return (
          <div className="card bg-base-200 bg-opacity-50" key={`${hotdog.logId}-${index}`}>
            <div className="card-body p-4 max-w-xs">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Avatar address={hotdog.eater} />
                  <span className="font-medium">
                    {hotdog.eaterProfile?.name ?? 
                     hotdog.eaterProfile?.username ?? 
                     `${hotdog.eater.slice(0, 6)}...${hotdog.eater.slice(-4)}`}
                  </span>
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
                    chainId={DEFAULT_CHAIN.id}
                    onAttestationMade={() => void refetchDogData()}
                    onAttestationAffirmationRevoked={() => void refetchDogData()}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={loadMoreRef} className="md:col-span-2 flex min-h-16 items-center justify-center">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <span className="loading loading-spinner loading-sm" />
            <span>Loading more dogs...</span>
          </div>
        ) : !hasNextPage && loadedHotdogs.length > 0 ? (
          <p className="text-sm text-base-content/60">You&apos;ve reached the end of this profile.</p>
        ) : null}
      </div>
    </div>
  );
}
import { useContext, useEffect, type FC, useState } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api, type RouterOutputs } from "~/utils/api";
import { useActiveAccount } from "thirdweb/react";
import HotdogImage from "~/components/utils/HotdogImage";
import { TagIcon } from "@heroicons/react/24/outline";
import { Avatar } from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import JudgeAttestation from "~/components/Attestation/Judge";
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "~/components/Attestation/AiJudgement";
import VotingCountdown from "./VotingCountdown";

type UserDogsResponse = RouterOutputs["hotdog"]["getAllForUser"];
type UserHotdog = UserDogsResponse["hotdogs"][number];

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

  const {
    data: dogData,
    isLoading: isLoadingHotdogs,
    refetch: refetchDogData,
  } = api.hotdog.getAllForUser.useQuery(
    {
      chainId: activeChain.id,
      user,
      limit: limitOrDefault,
    },
    {
      enabled: !!activeChain.id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (!account) return;
    void refetchDogData();
  }, [account, refetchDogData]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {isLoadingHotdogs &&
        Array.from({ length: limitOrDefault }).map((_, index) => (
          <div className="card bg-base-200 bg-opacity-50 p-4" key={index}>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 animate-pulse rounded-full bg-base-300" />
              <div className="h-4 w-20 animate-pulse rounded-lg bg-base-300" />
            </div>
            <div className="card-body p-4">
              <div className="mx-auto h-56 w-56 animate-pulse rounded-lg bg-base-300" />
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex items-center gap-1 text-xs">
                <div className="h-4 w-4 animate-pulse rounded-full bg-base-300" />
                <div className="h-4 w-8 animate-pulse rounded-lg bg-base-300" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-pulse rounded-full bg-base-300" />
                <span className="h-4 w-16 animate-pulse rounded-lg bg-base-300" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-16 animate-pulse rounded-lg bg-base-300" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="h-4 w-4 animate-pulse rounded-full bg-base-300" />
                <div className="h-4 w-4 animate-pulse rounded-full bg-base-300" />
              </div>
            </div>
          </div>
        ))}
      {dogData?.hotdogs.map((hotdog: UserHotdog, index: number) => {
        const validAttestations = dogData?.validAttestations[index];
        const invalidAttestations = dogData?.invalidAttestations[index];

        return (
          <div
            className="card bg-base-200 bg-opacity-50"
            key={`${hotdog.logId}-${index}`}
          >
            <div className="card-body max-w-xs p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar address={hotdog.eater} />
                  <Name address={hotdog.eater} />
                </div>
                <Revoke
                  hotdog={{
                    logId: hotdog.logId.toString(),
                    eater: hotdog.eater,
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
              <div className="flex w-full flex-row items-center justify-between opacity-50">
                <div className="flex items-center gap-1 text-xs">
                  <TagIcon className="h-4 w-4" />
                  {hotdog.logId.toString()}
                </div>
                <div className="flex items-center justify-end gap-2 text-xs">
                  <AiJudgement
                    logId={hotdog.logId.toString()}
                    timestamp={hotdog.timestamp.toString()}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
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
                    onAttestationAffirmationRevoked={() =>
                      void refetchDogData()
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="join place-content-center md:col-span-2">
        <button
          className="btn join-item"
          onClick={() => setStart((prev) => prev - limitOrDefault)}
          disabled={start === 0}
        >
          «
        </button>
        <button className="btn join-item">
          Page {Math.floor(start / limitOrDefault) + 1} of{" "}
          {dogData?.totalPages.toString() ?? "..."}
        </button>
        <button
          className="btn join-item"
          onClick={() => setStart((prev) => prev + limitOrDefault)}
          disabled={!dogData?.hasNextPage}
        >
          »
        </button>
      </div>
    </div>
  );
};

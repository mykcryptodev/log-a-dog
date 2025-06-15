import { useContext, useEffect, type FC, useState } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { CurrencyDollarIcon, FireIcon, TagIcon } from "@heroicons/react/24/outline";
import { Avatar } from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import { ZERO_ADDRESS } from "thirdweb";
import JudgeAttestation from "~/components/Attestation/Judge";
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "./AiJudgement";
import VotingCountdown from "./VotingCountdown";
import Comments from "~/components/Attestation/Comments";
import { env } from "~/env";
import { isAddressEqual } from "viem";
import { formatAbbreviatedFiat } from "~/helpers/formatFiat";
import dynamic from "next/dynamic";
const ZoraCoinTrading = dynamic(() => import("~/components/Attestation/ZoraCoinTrading"), { ssr: false });

const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60; // 48 hours

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
  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const [start, setStart] = useState<number>(0);

  const { data: dogData, isLoading: isLoadingHotdogs, refetch: refetchDogData } = api.hotdog.getAll.useQuery({
    chainId: activeChain.id,
    user: account?.address ?? ZERO_ADDRESS,
    start,
    limit: limitOrDefault,
  }, {
    enabled: !!activeChain.id,
  });

  console.log({ dogData })

  useEffect(() => {
    if (!account) return;
    void refetchDogData();
  }, [account, refetchDogData]);

  const showLoggedVia = (hotdog: { eater: `0x${string}`, logger: `0x${string}` }) => {
    const loggerIsNotEater = !isAddressEqual(hotdog.eater, hotdog.logger);
    const loggerIsNotBackendWallet = !isAddressEqual(hotdog.logger, env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`);
    return loggerIsNotEater && loggerIsNotBackendWallet;
  }

  // Create maps to ensure correct attestation data is passed by logId
  const validMap = dogData?.hotdogs && dogData.validAttestations ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.validAttestations[i]])) : {};
  const invalidMap = dogData?.hotdogs && dogData.invalidAttestations ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.invalidAttestations[i]])) : {};
  const userAttestedMap = dogData?.hotdogs && dogData.userAttested ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.userAttested[i]])) : {};
  const userAttestationMap = dogData?.hotdogs && dogData.userAttestations ? Object.fromEntries(dogData.hotdogs.map((h, i) => [h.logId, dogData.userAttestations[i]])) : {};

  return (
    <>
    <div id="top-of-list" className="invisible" />
    <div className="flex flex-col gap-4">
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
      {dogData?.hotdogs.map((hotdog) => {
        const isExpired =
          Number(hotdog.timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000 <= Date.now();
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
                    {showLoggedVia({ eater: hotdog.eater as `0x${string}`, logger: hotdog.logger as `0x${string}` }) && (
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
              {hotdog.zoraCoin && (
                <div className="flex items-center text-xs opacity-50 w-full justify-between">
                  <div className="flex items-center gap-0.5"><CurrencyDollarIcon className="w-4 h-4" /> MCAP ${formatAbbreviatedFiat(Number(hotdog.zoraCoin.marketCap))}</div>
                  <div className="flex items-center gap-0.5"><FireIcon className="w-4 h-4" /> 24H VOL ${formatAbbreviatedFiat(Number(hotdog.zoraCoin.volume24h))}</div>
                </div>
              )}
              <MediaRenderer
                src={hotdog.imageUri}
                client={client}
                className="rounded-lg"
                width={"100%"}
                height={"100%"}
              />
              <div className="opacity-50 flex flex-row w-full items-center justify-between">
                <div className="text-xs flex items-center gap-1">
                  {hotdog.zoraCoin?.address ? (
                    <ZoraCoinTrading
                      referrer={hotdog.eater}
                      coinAddress={hotdog.zoraCoin.address}
                      logId={hotdog.logId.toString()}
                    />
                  ) : (
                    <>
                      <TagIcon className="w-4 h-4" />
                      {hotdog.logId.toString()}
                    </>
                  )}
                </div>
                <div className="flex justify-end items-center gap-2 text-xs">
                  <AiJudgement 
                    logId={hotdog.logId.toString()}
                    timestamp={hotdog.timestamp.toString()}
                  />
                </div>
                <div className="flex justify-end items-center gap-1">
                  <Comments
                    logId={hotdog.logId.toString()}
                    metadataUri={hotdog.metadataUri}
                  />
                  {!isExpired && (
                    <JudgeAttestation
                      userAttested={userAttestedMap[hotdog.logId]}
                      userAttestation={userAttestationMap[hotdog.logId]}
                      validAttestations={validMap[hotdog.logId]?.toString()}
                      invalidAttestations={invalidMap[hotdog.logId]?.toString()}
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
                  userAttested={userAttestedMap[hotdog.logId]}
                  userAttestation={userAttestationMap[hotdog.logId]}
                  validAttestations={validMap[hotdog.logId]?.toString()}
                  invalidAttestations={invalidMap[hotdog.logId]?.toString()}
                  onResolutionComplete={() => void refetchDogData()}
                  attestationPeriod={hotdog.attestationPeriod}
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
}
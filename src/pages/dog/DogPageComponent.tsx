/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type NextPage } from "next";
import { useContext } from "react";
import Head from "next/head";
import { useActiveAccount } from "thirdweb/react";
import HotdogImage from "~/components/utils/HotdogImage";
import { api } from "~/utils/api";
import ActiveChainContext from "~/contexts/ActiveChain";
import { Avatar } from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "~/components/Attestation/AiJudgement";
import Comments from "~/components/Attestation/Comments";
import JudgeAttestation from "~/components/Attestation/Judge";
import VotingCountdown from "~/components/Attestation/VotingCountdown";
import {
  CurrencyDollarIcon,
  FireIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { ZERO_ADDRESS } from "thirdweb";
import { env } from "~/env";
import { isAddressEqual } from "viem";
import { formatAbbreviatedFiat } from "~/helpers/formatFiat";
import { ATTESTATION_WINDOW_SECONDS } from "~/constants";
import AttestationStatusBadge from "~/components/Attestation/AttestationStatusBadge";

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);

  const miniAppMetadata = {
    version: "next",
    imageUrl: `https://logadog.xyz/api/og/${logId}`,
    button: {
      title: "🌭 Log a Dog",
      action: {
        type: "launch_frame",
        name: "Log a Dog",
        url: `https://logadog.xyz/dog/${logId}`,
        splashImageUrl: "https://logadog.xyz/images/logo.png",
        splashBackgroundColor: "#faf8f7",
      },
    },
  };

  const { data, isLoading, refetch } = api.hotdog.getById.useQuery(
    {
      chainId: activeChain.id,
      user: account?.address ?? ZERO_ADDRESS,
      logId,
    },
    { enabled: !!logId && !!activeChain.id },
  );

  const showLoggedVia = (hotdog: {
    eater: `0x${string}`;
    logger: `0x${string}`;
  }) => {
    const loggerIsNotEater = !isAddressEqual(hotdog.eater, hotdog.logger);
    const loggerIsNotBackendWallet = !isAddressEqual(
      hotdog.logger,
      env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`,
    );
    return loggerIsNotEater && loggerIsNotBackendWallet;
  };

  if (isLoading || !data) {
    return (
      <>
        <Head>
          <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
        </Head>
        <main className="flex flex-col items-center justify-center">
          <div className="h-64 w-64 animate-pulse rounded-lg bg-base-300" />
        </main>
      </>
    );
  }

  const {
    hotdog,
    validAttestations,
    invalidAttestations,
    userAttested,
    userAttestation,
  } = data;
  const isExpired =
    Number(hotdog.timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000 <=
    Date.now();

  return (
    <>
      <Head>
        <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
      </Head>
      <main className="flex flex-col items-center justify-center">
        <div className="container flex flex-col items-center gap-6 px-4 py-8">
          <div className="card w-full max-w-md bg-base-200 bg-opacity-25 shadow backdrop-blur-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-start">
                  <div className="flex w-fit items-center gap-2">
                    <Avatar address={hotdog.eater} fallbackSize={24} />
                    <Name address={hotdog.eater} />
                  </div>
                  {showLoggedVia({
                    eater: hotdog.eater as `0x${string}`,
                    logger: hotdog.logger as `0x${string}`,
                  }) && (
                    <div className="flex items-center gap-1 text-xs opacity-75">
                      <span>via</span>
                      <Avatar address={hotdog.logger} size="16px" />
                      <Name address={hotdog.logger} />
                    </div>
                  )}
                </div>
                <Revoke hotdog={hotdog} onRevocation={() => void refetch()} />
              </div>
              {hotdog.zoraCoin && (
                <div className="flex w-full items-center justify-between text-xs opacity-50">
                  <div className="flex items-center gap-0.5">
                    <CurrencyDollarIcon className="h-4 w-4" /> MCAP $
                    {formatAbbreviatedFiat(Number(hotdog.zoraCoin.marketCap))}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <FireIcon className="h-4 w-4" /> 24H VOL $
                    {formatAbbreviatedFiat(Number(hotdog.zoraCoin.volume24h))}
                  </div>
                </div>
              )}
              <HotdogImage
                src={hotdog.imageUri}
                zoraCoin={hotdog.zoraCoin}
                className="rounded-lg"
                width="100%"
                height="100%"
              />
              <div className="flex w-full flex-row items-center justify-between opacity-50">
                <div className="flex items-center gap-1 text-xs">
                  {hotdog.zoraCoin?.address ? (
                    <AttestationStatusBadge
                      attestationPeriod={hotdog.attestationPeriod}
                    />
                  ) : (
                    <>
                      <TagIcon className="h-4 w-4" />
                      {hotdog.logId.toString()}
                    </>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 text-xs">
                  <AiJudgement
                    logId={hotdog.logId.toString()}
                    timestamp={hotdog.timestamp.toString()}
                  />
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Comments
                    logId={hotdog.logId.toString()}
                    metadataUri={hotdog.metadataUri}
                  />
                  {!isExpired && (
                    <JudgeAttestation
                      disabled={userAttested}
                      userAttested={userAttested}
                      userAttestation={userAttestation}
                      validAttestations={validAttestations}
                      invalidAttestations={invalidAttestations}
                      logId={hotdog.logId}
                      chainId={activeChain.id}
                      onAttestationMade={() => void refetch()}
                      onAttestationAffirmationRevoked={() => void refetch()}
                    />
                  )}
                </div>
              </div>
              <div className="flex w-full items-center justify-end gap-2 pr-2 text-xs opacity-50">
                <VotingCountdown
                  timestamp={hotdog.timestamp.toString()}
                  logId={hotdog.logId.toString()}
                  validAttestations={validAttestations}
                  invalidAttestations={invalidAttestations}
                  onResolutionComplete={() => void refetch()}
                  attestationPeriod={hotdog.attestationPeriod}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default DogPage;

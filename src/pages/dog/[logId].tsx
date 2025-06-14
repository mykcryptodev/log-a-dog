import { type NextPage, type GetServerSideProps } from "next";
import { useContext } from "react";
import Head from "next/head";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { api } from "~/utils/api";
import ActiveChainContext from "~/contexts/ActiveChain";
import { Avatar } from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "~/components/Attestation/AiJudgement";
import Comments from "~/components/Attestation/Comments";
import JudgeAttestation from "~/components/Attestation/Judge";
import VotingCountdown from "~/components/Attestation/VotingCountdown";
import { ZoraCoinTrading } from "~/components/Attestation/ZoraCoinTrading";
import { CurrencyDollarIcon, FireIcon, TagIcon } from "@heroicons/react/24/outline";
import { ZERO_ADDRESS } from "thirdweb";
import { env } from "~/env";
import { isAddressEqual } from "viem";
import { formatAbbreviatedFiat } from "~/helpers/formatFiat";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { logId } = context.params as { logId: string };
  return { props: { logId } };
};

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);

  const miniAppMetadata = {
    version: "next",
    imageUrl: "https://yoink.party/framesV2/opengraph-image",
    button: {
      title: "\uD83C\uDF2D Log a Dog",
      action: {
        type: "launch_frame",
        name: "Log a Dog",
        url: `https://logadog.xyz/dog/${logId}`,
        splashImageUrl: "https://logadog.xyz/images/logo.png",
        splashBackgroundColor: "#faf8f7",
      },
    },
  };

  const { data, isLoading, refetch } = api.hotdog.getById.useQuery({
    chainId: activeChain.id,
    user: account?.address ?? ZERO_ADDRESS,
    logId,
  }, { enabled: !!logId && !!activeChain.id });

  const showLoggedVia = (hotdog: { eater: `0x${string}`; logger: `0x${string}` }) => {
    const loggerIsNotEater = !isAddressEqual(hotdog.eater, hotdog.logger);
    const loggerIsNotBackendWallet = !isAddressEqual(hotdog.logger, env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`);
    return loggerIsNotEater && loggerIsNotBackendWallet;
  };

  if (isLoading || !data) {
    return (
      <>
        <Head>
          <meta name="fc:miniapp" content={JSON.stringify(miniAppMetadata)} />
        </Head>
        <main className="flex flex-col items-center justify-center">
          <div className="w-64 h-64 bg-base-300 animate-pulse rounded-lg" />
        </main>
      </>
    );
  }

  const { hotdog, validAttestations, invalidAttestations, userAttested, userAttestation } = data;

  return (
    <>
      <Head>
        <meta name="fc:miniapp" content={JSON.stringify(miniAppMetadata)} />
      </Head>
      <main className="flex flex-col items-center justify-center">
        <div className="container flex flex-col items-center gap-6 px-4 py-8">
          <div className="card bg-base-200 bg-opacity-25 backdrop-blur-sm shadow w-full max-w-md">
            <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 w-fit">
                  <Avatar address={hotdog.eater} fallbackSize={24} />
                  <Name address={hotdog.eater} />
                </div>
                {showLoggedVia({ eater: hotdog.eater as `0x${string}`, logger: hotdog.logger as `0x${string}` }) && (
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
                <JudgeAttestation
                  userAttested={userAttested}
                  userAttestation={userAttestation}
                  validAttestations={validAttestations}
                  invalidAttestations={invalidAttestations}
                  logId={hotdog.logId}
                  chainId={activeChain.id}
                  onAttestationMade={() => void refetch()}
                  onAttestationAffirmationRevoked={() => void refetch()}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full justify-end pr-2 opacity-50 text-xs">
              <VotingCountdown timestamp={hotdog.timestamp.toString()} />
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  );
};

export default DogPage;

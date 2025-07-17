import { type NextPage } from "next";
import { DEFAULT_CHAIN } from "~/constants";
import Head from "next/head";
import { useActiveAccount } from "thirdweb/react";
import { api } from "~/utils/api";
import { ZERO_ADDRESS } from "thirdweb";
import HotdogCard from "~/components/utils/HotdogCard";

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const account = useActiveAccount();
  const activeChain = DEFAULT_CHAIN;

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

  const { data, isLoading, refetch } = api.hotdog.getById.useQuery({
    chainId: activeChain.id,
    user: account?.address ?? ZERO_ADDRESS,
    logId,
  }, { enabled: !!logId && !!activeChain.id });

  if (isLoading || !data) {
    return (
      <>
        <Head>
          <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
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
        <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
      </Head>
      <main className="flex flex-col items-center justify-center">
        <div className="container flex flex-col items-center gap-6 px-4 py-8">
          <HotdogCard
            hotdog={hotdog}
            validAttestations={validAttestations ?? "0"}
            invalidAttestations={invalidAttestations ?? "0"}
            userAttested={userAttested ?? false}
            userAttestation={userAttestation ?? false}
            chainId={activeChain.id}
            onRefetch={() => void refetch()}
            linkToDetail={false}
            showAiJudgement={true}
            disabled={false}
          />
        </div>
      </main>
    </>
  );
};

export default DogPage;

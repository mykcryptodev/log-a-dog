import { type NextPage } from "next";
import Head from "next/head";
import { useActiveAccount } from "thirdweb/react";
import { api } from "~/utils/api";
import { ZERO_ADDRESS } from "thirdweb";
import HotdogCard from "~/components/utils/HotdogCard";
import { DEFAULT_CHAIN } from "~/constants";

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const account = useActiveAccount();

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
    chainId: DEFAULT_CHAIN.id,
    user: account?.address ?? ZERO_ADDRESS,
    logId,
  }, { enabled: !!logId && !!DEFAULT_CHAIN.id });

  if (isLoading || !data) {
    return (
      <>
        <Head>
          <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
        </Head>
        <main className="flex flex-col items-center justify-center">
          <div className="pop-card w-64 h-64 bg-base-300 animate-pulse rounded-2xl" />
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
      <main className="flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl">
          <HotdogCard
            hotdog={hotdog}
            validAttestations={validAttestations ?? "0"}
            invalidAttestations={invalidAttestations ?? "0"}
            userAttested={userAttested ?? false}
            userAttestation={userAttestation ?? false}
            chainId={DEFAULT_CHAIN.id}
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

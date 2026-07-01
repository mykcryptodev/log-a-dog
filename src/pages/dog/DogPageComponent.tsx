import { type NextPage } from "next";
import { useActiveAccount } from "thirdweb/react";
import { api } from "~/utils/api";
import { ZERO_ADDRESS } from "thirdweb";
import HotdogCard from "~/components/utils/HotdogCard";
import { DEFAULT_CHAIN } from "~/constants";

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const account = useActiveAccount();

  // Share metadata (fc:frame, Open Graph, Twitter) lives in the server-rendered
  // wrapper at dog/[logId].tsx. This component is loaded with ssr:false, so any
  // <Head> here would never reach crawlers.
  const { data, isLoading, refetch } = api.hotdog.getById.useQuery({
    chainId: DEFAULT_CHAIN.id,
    user: account?.address ?? ZERO_ADDRESS,
    logId,
  }, { enabled: !!logId && !!DEFAULT_CHAIN.id });

  if (isLoading || !data) {
    return (
      <main className="flex flex-col items-center justify-center">
        <div className="pop-card w-64 h-64 bg-base-300 animate-pulse rounded-2xl" />
      </main>
    );
  }

  const { hotdog, validAttestations, invalidAttestations, userAttested, userAttestation } = data;

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center gap-6 px-4 py-8">
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
  );
};

export default DogPage;

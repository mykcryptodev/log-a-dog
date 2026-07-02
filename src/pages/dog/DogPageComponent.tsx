import { type NextPage } from "next";
import { useActiveAccount } from "thirdweb/react";
import { api } from "~/utils/api";
import { ZERO_ADDRESS } from "thirdweb";
import HotdogCard from "~/components/utils/HotdogCard";
import { HotdogLoader } from "~/components/utils/HotdogLoader";
import { DEFAULT_CHAIN } from "~/constants";

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const account = useActiveAccount();

  const { data, isLoading, refetch } = api.hotdog.getById.useQuery({
    chainId: DEFAULT_CHAIN.id,
    user: account?.address ?? ZERO_ADDRESS,
    logId,
  }, { enabled: !!logId && !!DEFAULT_CHAIN.id });

  if (isLoading || !data) {
    return (
      <main className="flex flex-col items-center justify-center">
          <div className="pop-card flex h-64 w-64 items-center justify-center rounded-2xl bg-base-300">
            <HotdogLoader size={44} vertical label="Fetching this dog…" />
          </div>
      </main>
    );
  }

  const { hotdog, validAttestations, invalidAttestations, userAttested, userAttestation } = data;

  return (
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
  );
};

export default DogPage;

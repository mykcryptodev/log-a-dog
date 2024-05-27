import { ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";

type Props = {
  logId: string;
  timestamp: string;
}
export const AiJudgement: FC<Props> = ({ logId, timestamp }) => {
  const { activeChain } = useContext(ActiveChainContext);

  const { data, isLoading } = api.hotdog.getAiVerificationStatus.useQuery({
    chainId: activeChain.id,
    logId,
    timestamp,
  }, {
    enabled: !!activeChain.id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <span className="w-4 h-4 bg-base-300 animate-pulse rounded-full" />
        <span className="w-16 h-4 bg-base-300 animate-pulse rounded-lg" />
      </div>
    )
  }

  if (data === "REJECTED") {
    return (
      <div className="flex items-center gap-1">
        <ShieldExclamationIcon className="h-4 w-4" />
        <span>
          AI Refuted
        </span>
      </div>
    )
  }

  if (data === "VERIFIED") {
    return (
      <div className="flex items-center gap-1">
        <ShieldCheckIcon className="h-4 w-4" />
        <span>
          AI Verified
        </span>
      </div>
    )
  }

  return null;
};

export default AiJudgement;
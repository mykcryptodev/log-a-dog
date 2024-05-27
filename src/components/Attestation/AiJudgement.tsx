import { ShieldCheckIcon, ShieldExclamationIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { Portal } from "~/components/utils/Portal";

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
      <>
        <label htmlFor={`${logId}-ai-refuted-modal`} className="btn btn-ghost btn-xs font-normal flex items-center gap-1">
          <ShieldExclamationIcon className="h-4 w-4" />
          <span>
            AI Refuted
          </span>
        </label>

        <Portal>
          <input type="checkbox" id={`${logId}-ai-refuted-modal`} className="modal-toggle" />
          <div className="modal" role="dialog">
            <div className="modal-box relative">
              <label htmlFor={`${logId}-ai-refuted-modal`} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
                <XMarkIcon className="h-4 w-4" />
              </label>
              <h3 className="font-bold text-lg gap-2 flex items-center">
                <ShieldExclamationIcon className="h-6 w-6 stroke-2" />
                Refuted!
              </h3>
              <p className="py-4">Our AI bot did not find anyone eating a hotdog in this photo.</p>
              <p>AI bots can be wrong so only use it as one data point when reviewing the submissions of others.</p>
              <div className="modal-action">
                <label htmlFor={`${logId}-ai-refuted-modal`} className="btn">Close</label>
              </div>
            </div>
          </div>
        </Portal>
      </>
    )
  }

  if (data === "VERIFIED") {
    return (
      <>
        <label htmlFor={`${logId}-ai-verified-modal`} className="btn btn-ghost btn-xs font-normal flex items-center gap-1">
          <ShieldCheckIcon className="h-4 w-4" />
          <span>
            AI Verified
          </span>
        </label>

        <Portal>
          <input type="checkbox" id={`${logId}-ai-verified-modal`} className="modal-toggle" />
          <div className="modal" role="dialog">
            <div className="modal-box relative">
              <label htmlFor={`${logId}-ai-verified-modal`} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
                <XMarkIcon className="h-4 w-4" />
              </label>
              <h3 className="font-bold text-lg gap-2 flex items-center">
                <ShieldCheckIcon className="h-6 w-6 stroke-2" />
                Verified!
              </h3>
              <p className="py-4">Our AI bot found someone eating a hotdog in this photo.</p>
              <p>That does not mean that this submission is objectively valid. Feel free to use this as one data point when reviewing submissions of others.</p>
              <div className="modal-action">
                <label htmlFor={`${logId}-ai-verified-modal`} className="btn">Close</label>
              </div>
            </div>
          </div>
        </Portal>
      </>
    )
  }

  return null;
};

export default AiJudgement;
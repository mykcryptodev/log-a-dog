import { type FC, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { QuestionMarkCircleIcon, XMarkIcon, GiftIcon } from "@heroicons/react/24/outline";
import { Portal } from "~/components/utils/Portal";
import { api } from "~/utils/api";
import { toast } from "react-toastify";
import { ATTESTATION_WINDOW_SECONDS } from "~/constants";
        
interface Props {
  timestamp: string; // unix timestamp in seconds
  logId?: string;
  validAttestations?: string;
  invalidAttestations?: string;
  onResolutionComplete?: () => void;
  attestationPeriod?: {
    startTime: string;
    endTime: string;
    status: number;
    totalValidStake: string;
    totalInvalidStake: string;
    isValid: boolean;
  };
}


export const VotingCountdown: FC<Props> = ({
  timestamp,
  logId,
  validAttestations,
  invalidAttestations,
  onResolutionComplete,
  attestationPeriod,
}) => {
  const calculateTimeLeft = useCallback(() => {
    const end = Number(timestamp) + ATTESTATION_WINDOW_SECONDS;
    const now = Math.floor(Date.now() / 1000);
    const difference = end - now;

    if (difference > 0) {
      const hours = Math.floor(difference / 3600);
      const minutes = Math.floor((difference % 3600) / 60);
      const seconds = difference % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    return "Expired";
  }, [timestamp]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);
  const [isRewardingModerators, setIsRewardingModerators] = useState(false);
  
  const { data: session } = useSession();
  const { activeChain } = useContext(ActiveChainContext);

  const rewardModeratorsMutation = api.hotdog.rewardModerators.useMutation({
    onSuccess: () => {
      toast.success("Rewards are being distributed to moderators!");
      setIsRewardingModerators(false);
      onResolutionComplete?.();
    },
    onError: (error) => {
      toast.error(`Failed to reward moderators: ${error.message}`);
      setIsRewardingModerators(false);
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const isExpired = timeLeft === "Expired";
  const totalVotes = Number(validAttestations ?? 0) + Number(invalidAttestations ?? 0);
  
  // Check if the attestation period is resolved using the cached data
  // AttestationStatus enum: 0 = Active, 1 = Resolved, 2 = Disputed
  const isResolved = attestationPeriod?.status === 1;
  
  const handleRewardModerators = () => {
    if (!logId || !session?.user?.address || !activeChain) return;
    
    setIsRewardingModerators(true);
    rewardModeratorsMutation.mutate({
      chainId: activeChain.id,
      logId,
    });
  };

  return (
    <div className="flex items-center">
      {!isExpired && (
        <>
          <label htmlFor={`${logId ?? timestamp}-voting-info`} className="btn btn-ghost btn-circle btn-xs">
            <QuestionMarkCircleIcon className="w-3 h-3" />
          </label>
          <span className="font-mono text-xs opacity-50">
            {timeLeft}
          </span>
        </>
      )}
      
      {isExpired && !isResolved && logId && session?.user?.address && (
        <>
          <button
            onClick={handleRewardModerators}
            disabled={isRewardingModerators}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded transition-colors"
          >
            <GiftIcon className="w-3 h-3" />
            {isRewardingModerators ? "Processing..." : "Reward Moderators"}
          </button>
          
          <label htmlFor={`${logId}-reward-explanation`} className="btn btn-ghost btn-circle btn-xs">
            <QuestionMarkCircleIcon className="w-4 h-4" />
          </label>
        </>
      )}

      {isExpired && totalVotes > 0 && (
        <span className="text-xs opacity-50">
          Final: {validAttestations ?? 0} valid, {invalidAttestations ?? 0} invalid
        </span>
      )}

      {/* Voting Info Modal */}
      <Portal>
        <input type="checkbox" id={`${logId ?? timestamp}-voting-info`} className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
            <label htmlFor={`${logId ?? timestamp}-voting-info`} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
              <XMarkIcon className="w-4 h-4" />
            </label>
            <h3 className="font-bold text-lg">Hotdog vs Not Hotdog</h3>
            <p className="py-2">The countdown timer is how long you have to judge whether or not the hotdog is valid or not.</p>
            <p className="py-2">Users moderate each other by judging if an uploaded photo should count towards the contest or not. This prevents duplicates, fakes, and other spam.</p>
            <p className="py-2">To keep users honest, they stake $HOTDOG tokens. If their judgement aligns with the majority of other judgements, they earn a portion of $HOTDOG tokens from voters who judged incorrectly.</p>
            <p className="py-2">Once the timer is over, nobody can vote on this submission anymore and if the submission received more yes&apos;s than no&apos;s, it counts towards the total.</p>
            <div className="modal-action">
              <label htmlFor={`${logId ?? timestamp}-voting-info`} className="btn">Close</label>
            </div>
          </div>
        </div>
      </Portal>

      {/* Reward Moderators Explanation Modal */}
      {logId && (
        <Portal>
          <input type="checkbox" id={`${logId}-reward-explanation`} className="modal-toggle" />
          <div className="modal modal-bottom sm:modal-middle" role="dialog">
            <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
              <label htmlFor={`${logId}-reward-explanation`} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
                <XMarkIcon className="w-4 h-4" />
              </label>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <GiftIcon className="h-6 w-6" />
                Reward Moderators
              </h3>
              <p className="py-2">
                The voting period has ended! Click this button to finalize the results and distribute rewards to moderators.
              </p>
              <p className="py-2">
                This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Determine the final winner based on total staked votes</li>
                <li>Distribute $HOTDOG rewards to correct voters proportionally</li>
                <li>Slash 15% of incorrect voters&apos; stakes</li>
                <li>Unlock all remaining staked tokens</li>
                <li>Mark this submission as officially counted</li>
              </ul>
              <p className="py-2 text-sm text-base-content/70">
                Anyone can trigger this action once the 48-hour voting period ends.
              </p>
              <div className="modal-action">
                <label htmlFor={`${logId}-reward-explanation`} className="btn">Close</label>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default VotingCountdown;

import { type FC, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { formatEther } from "viem";
import ActiveChainContext from "~/contexts/ActiveChain";
import { STAKING, ATTESTATION_MANAGER } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { QuestionMarkCircleIcon, XMarkIcon, GiftIcon } from "@heroicons/react/24/outline";
import { Portal } from "~/components/utils/Portal";
import { api } from "~/utils/api";
import { toast } from "react-toastify";
        
interface Props {
  timestamp: string; // unix timestamp in seconds
  logId?: string;
  userAttested?: boolean;
  userAttestation?: boolean;
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

const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60; // 48 hours

export const VotingCountdown: FC<Props> = ({
  timestamp,
  logId,
  userAttested,
  userAttestation,
  validAttestations,
  invalidAttestations,
  onResolutionComplete,
  attestationPeriod,
}) => {
  const calculateTimeLeft = () => {
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
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
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
  }, [timestamp]);

  const isExpired = timeLeft === "Expired";
  const totalVotes = Number(validAttestations || 0) + Number(invalidAttestations || 0);
  
  // Check if the attestation period is resolved using the cached data
  const isResolved = attestationPeriod?.status === 2; // Assuming status 2 means resolved
  
  const handleRewardModerators = () => {
    if (!logId || !session?.user?.address || !activeChain) return;
    
    setIsRewardingModerators(true);
    rewardModeratorsMutation.mutate({
      chainId: activeChain.id,
      logId,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {!isExpired && (
        <span className="text-xs opacity-50">
          Vote ends in: {timeLeft}
        </span>
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
          
          <button
            onClick={() => setShowExplanationModal(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
          </button>
        </>
      )}

      {isExpired && totalVotes > 0 && (
        <span className="text-xs opacity-50">
          Final: {validAttestations || 0} valid, {invalidAttestations || 0} invalid
        </span>
      )}

      {showExplanationModal && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Reward Moderators</h3>
                <button
                  onClick={() => setShowExplanationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  The voting period for this hotdog submission has ended. Click "Reward Moderators" to:
                </p>
                
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Calculate the final result based on all votes</li>
                  <li>Distribute $HOTDOG token rewards to moderators who voted with the majority</li>
                  <li>Slash tokens from moderators who voted incorrectly</li>
                  <li>Finalize whether this submission counts toward the contest</li>
                </ul>
                
                <p className="text-xs text-gray-500 mt-4">
                  This action can be performed by anyone and helps keep the system running smoothly.
                </p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowExplanationModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default VotingCountdown;

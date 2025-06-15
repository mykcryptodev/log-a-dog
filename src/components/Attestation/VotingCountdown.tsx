import { type FC, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { formatEther } from "viem";
import ActiveChainContext from "~/contexts/ActiveChain";
import { STAKING, ATTESTATION_MANAGER } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Portal } from "~/components/utils/Portal";
        
interface Props {
  timestamp: string; // unix timestamp in seconds
  logId?: string;
  userAttested?: boolean;
  userAttestation?: boolean;
  validAttestations?: string;
  invalidAttestations?: string;
}

const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60; // 48 hours

export const VotingCountdown: FC<Props> = ({
  timestamp,
  logId,
  userAttested,
  userAttestation,
  validAttestations,
  invalidAttestations,
}) => {
  const calculateTimeLeft = () => {
    const end = Number(timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000;
    const diff = Math.max(0, end - Date.now());
    return Math.floor(diff / 1000); // seconds
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timestamp]);

  const hours = Math.floor(secondsLeft / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((secondsLeft % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(secondsLeft % 60)
    .toString()
    .padStart(2, "0");

  const { data: sessionData } = useSession();
  const { activeChain } = useContext(ActiveChainContext);

  const winnerIsValid =
    validAttestations !== undefined &&
    invalidAttestations !== undefined &&
    BigInt(validAttestations) >= BigInt(invalidAttestations);

  const isExpired = secondsLeft <= 0;

  const { data: pendingRewards } = useReadContract({
    contract: getContract({
      address: STAKING[activeChain.id]!,
      client,
      chain: activeChain,
    }),
    method: "function getPendingRewards(address user) view returns (uint256)",
    params: [sessionData?.user.address ?? "0x0"],
    queryOptions: {
      enabled:
        isExpired &&
        !!logId &&
        userAttested &&
        userAttestation === winnerIsValid &&
        !!sessionData?.user.address,
    },
  });

  const { data: stakeAmount } = useReadContract({
    contract: getContract({
      address: ATTESTATION_MANAGER[activeChain.id]!,
      client,
      chain: activeChain,
    }),
    method:
      "function getUserStakeInAttestation(uint256 logId, address user) view returns (uint256)",
    params: [BigInt(logId ?? "0"), sessionData?.user.address ?? "0x0"],
    queryOptions: {
      enabled:
        isExpired &&
        !!logId &&
        userAttested &&
        userAttestation !== winnerIsValid &&
        !!sessionData?.user.address,
    },
  });

  const { data: slashPercentage } = useReadContract({
    contract: getContract({
      address: STAKING[activeChain.id]!,
      client,
      chain: activeChain,
    }),
    method: "function SLASH_PERCENTAGE() view returns (uint256)",
    params: [],
    queryOptions: {
      enabled:
        isExpired &&
        !!logId &&
        userAttested &&
        userAttestation !== winnerIsValid,
    },
  });

  if (isExpired && logId) {
    if (userAttested) {
      if (userAttestation === winnerIsValid) {
        const reward = pendingRewards ? Number(formatEther(pendingRewards)).toFixed(4) : null;
        return (
          <span className="font-mono text-xs text-success">
            {reward ? `Earned ${reward} $HOTDOG` : "You voted correctly!"}
          </span>
        );
      } else {
        const slashPct = slashPercentage ? Number(slashPercentage) : 0;
        const stake = stakeAmount ? Number(formatEther(stakeAmount)) : 0;
        const slashed = ((stake * slashPct) / 100).toFixed(4);
        return (
          <span className="font-mono text-xs text-error">Slashed {slashed} $HOTDOG</span>
        );
      }
    }

    return <span className="font-mono text-xs">Voting ended</span>;
  }

  const id = `${logId ?? timestamp}-voting-info`;

  return (
    <>
      <span className="font-mono text-xs flex items-center gap-1">
        <label htmlFor={id} className="btn btn-ghost btn-circle btn-xs">
          <QuestionMarkCircleIcon className="h-3 w-3" />
        </label>
        {hours}h {minutes}m {seconds}s
      </span>
      <Portal>
        <input type="checkbox" id={id} className="modal-toggle" />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box relative bg-base-100 bg-opacity-90 backdrop-blur-lg">
            <label htmlFor={id} className="btn btn-ghost btn-circle btn-xs absolute top-4 right-4">
              <XMarkIcon className="h-4 w-4" />
            </label>
            <h3 className="font-bold text-lg">Hotdog vs Not Hotdog</h3>
            <p className="py-2">The countdown timer is how long you have to judge whether or not the hotdog is valid or not.</p>
            <p className="py-2">Users moderate each other by judging if an uploaded photo should count towards the contest or not. This prevents duplicates, fakes, and other spam.</p>
            <p className="py-2">To keep users honest, they stake $HOTDOG tokens. If their judgement aligns with the majority of other judgements, they earn a portion of $HOTDOG tokens from voters who judged incorrectly.</p>
            <p className="py-2">Once the timer is over, nobody can vote on this submission anymore and if the submission received more yes&apos;s than no&apos;s, it counts towards the total.</p>
            <div className="modal-action">
              <label htmlFor={id} className="btn">Close</label>
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default VotingCountdown;

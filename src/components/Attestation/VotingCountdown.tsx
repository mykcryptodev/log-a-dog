import { type FC, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { formatEther } from "viem";
import ActiveChainContext from "~/contexts/ActiveChain";
import { STAKING, ATTESTATION_MANAGER } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
        
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

  return (
    <span className="font-mono text-xs">
      {hours}h {minutes}m {seconds}s
    </span>
  );
};

export default VotingCountdown;

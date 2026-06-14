import { type FC, useMemo } from "react";
import { useSession } from "next-auth/react";
import { TransactionButton, useActiveWallet, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { formatEther } from "viem";
import { STAKING, STAKING_V1 } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { claimRewards } from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";
import { toast } from "react-toastify";
import { DEFAULT_CHAIN } from "~/constants";

export const ClaimRewards: FC = () => {
  const { data: sessionData } = useSession();
  const wallet = useActiveWallet();
  const stakingAddress = STAKING[DEFAULT_CHAIN.id]!;
  const legacyStakingAddress = STAKING_V1[DEFAULT_CHAIN.id]!;
  const hasSeparateLegacyStaking =
    stakingAddress.toLowerCase() !== legacyStakingAddress.toLowerCase();
  const stakingContract = useMemo(
    () =>
      getContract({
        address: stakingAddress,
        client,
        chain: DEFAULT_CHAIN,
      }),
    [stakingAddress],
  );
  const legacyStakingContract = useMemo(
    () =>
      getContract({
        address: legacyStakingAddress,
        client,
        chain: DEFAULT_CHAIN,
      }),
    [legacyStakingAddress],
  );

  const { data: pendingRewards } = useReadContract({
    contract: stakingContract,
    method: "function getPendingRewards(address user) view returns (uint256)",
    params: [sessionData?.user.address ?? "0x0"],
    queryOptions: {
      enabled: !!sessionData?.user.address,
    },
  });

  const { data: legacyPendingRewards } = useReadContract({
    contract: legacyStakingContract,
    method: "function getPendingRewards(address user) view returns (uint256)",
    params: [sessionData?.user.address ?? "0x0"],
    queryOptions: {
      enabled: !!sessionData?.user.address && hasSeparateLegacyStaking,
    },
  });

  const reward = pendingRewards ? Number(formatEther(pendingRewards)).toFixed(4) : "0";
  const legacyReward = legacyPendingRewards ? Number(formatEther(legacyPendingRewards)).toFixed(4) : "0";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Current Season Rewards</span>
        <span className="font-mono text-sm">{reward} $HOTDOG</span>
      </div>
      <TransactionButton
        className="!btn !btn-primary !btn-block"
        transaction={() =>
          claimRewards({
            contract: stakingContract,
          })
        }
        onTransactionSent={() => toast.loading("Claiming rewards...")}
        onTransactionConfirmed={() => {
          toast.dismiss();
          toast.success("Rewards claimed!");
        }}
        onError={(err) => {
          toast.dismiss();
          toast.error(`Claim failed: ${err.message}`);
        }}
        disabled={!wallet || !pendingRewards || pendingRewards === 0n}
      >
        Claim
      </TransactionButton>

      {hasSeparateLegacyStaking && (
        <div className="rounded-lg border border-base-300 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Legacy V1 Rewards</span>
            <span className="font-mono text-sm">{legacyReward} $HOTDOG</span>
          </div>
          <p className="mb-3 text-sm opacity-70">
            These rewards are from the previous staking contract and do not count toward the current season.
          </p>
          <TransactionButton
            className="!btn !btn-outline !btn-block"
            transaction={() =>
              claimRewards({
                contract: legacyStakingContract,
              })
            }
            onTransactionSent={() => toast.loading("Claiming V1 rewards...")}
            onTransactionConfirmed={() => {
              toast.dismiss();
              toast.success("V1 rewards claimed!");
            }}
            onError={(err) => {
              toast.dismiss();
              toast.error(`V1 claim failed: ${err.message}`);
            }}
            disabled={!wallet || !legacyPendingRewards || legacyPendingRewards === 0n}
          >
            Claim V1
          </TransactionButton>
        </div>
      )}
    </div>
  );
};

export default ClaimRewards;

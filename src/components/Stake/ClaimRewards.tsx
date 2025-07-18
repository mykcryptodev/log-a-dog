import { type FC } from "react";
import { useSession } from "next-auth/react";
import { TransactionButton, useActiveWallet, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { formatEther } from "viem";
import { STAKING } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { claimRewards } from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";
import { toast } from "react-toastify";
import { DEFAULT_CHAIN } from "~/constants";

export const ClaimRewards: FC = () => {
  const { data: sessionData } = useSession();
  const wallet = useActiveWallet();

  const { data: pendingRewards } = useReadContract({
    contract: getContract({
      address: STAKING[DEFAULT_CHAIN.id]!,
      client,
      chain: DEFAULT_CHAIN,
    }),
    method: "function getPendingRewards(address user) view returns (uint256)",
    params: [sessionData?.user.address ?? "0x0"],
    queryOptions: {
      enabled: !!sessionData?.user.address,
    },
  });

  const reward = pendingRewards ? Number(formatEther(pendingRewards)).toFixed(4) : "0";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Pending Rewards</span>
        <span className="font-mono text-sm">{reward} $HOTDOG</span>
      </div>
      <TransactionButton
        className="!btn !btn-primary !btn-block"
        transaction={() =>
          claimRewards({
            contract: getContract({
              address: STAKING[DEFAULT_CHAIN.id]!,
              client,
              chain: DEFAULT_CHAIN,
            }),
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
    </div>
  );
};

export default ClaimRewards;

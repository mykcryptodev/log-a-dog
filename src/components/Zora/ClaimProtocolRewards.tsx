import { type FC, useContext } from "react";
import { useSession } from "next-auth/react";
import { TransactionButton, useActiveWallet, useReadContract } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import ActiveChainContext from "~/contexts/ActiveChain";
import { PROTOCOL_REWARDS } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { formatEther } from "viem";
import { toast } from "react-toastify";

export const ClaimProtocolRewards: FC = () => {
  const { data: sessionData } = useSession();
  const wallet = useActiveWallet();
  const { activeChain } = useContext(ActiveChainContext);

  const { data: balance } = useReadContract({
    contract: getContract({
      address: PROTOCOL_REWARDS[activeChain.id]!,
      client,
      chain: activeChain,
    }),
    method: "function balanceOf(address) view returns (uint256)",
    params: [sessionData?.user.address ?? "0x0"],
    queryOptions: { enabled: !!sessionData?.user.address },
  });

  const reward = balance ? Number(formatEther(balance)).toFixed(4) : "0";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Creator Rewards</span>
        <span className="font-mono text-sm">{reward} ETH</span>
      </div>
      <TransactionButton
        className="!btn !btn-primary !btn-block"
        transaction={() =>
          prepareContractCall({
            contract: getContract({
              address: PROTOCOL_REWARDS[activeChain.id]!,
              client,
              chain: activeChain,
            }),
            method: "function withdraw(address to, uint256 amount)",
            params: [sessionData?.user.address ?? "0x0", balance ?? 0n],
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
        disabled={!wallet || !balance || balance === 0n}
      >
        Claim
      </TransactionButton>
    </div>
  );
};

export default ClaimProtocolRewards;

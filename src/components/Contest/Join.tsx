import { useContext, type FC } from "react";
import { toast } from "react-toastify";
import { getContract, prepareContractCall } from "thirdweb";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { CONTESTS } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import { ProfileButton } from "~/components/Profile/Button";
import { api } from "~/utils/api";

type Props = {
  contest: {
    id: string;
    name: string;
    metadata: string;
    startDate: Date;
    endDate: Date;
    creator: string;
    contestants: readonly string[];
    isInviteOnly: boolean;
  };
  onContestJoined?: (contestId: number) => void;
}
export const JoinContest: FC<Props> = ({ contest, onContestJoined }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const account = useActiveAccount();
  const { data: joinRequests } = api.contest.getJoinRequests.useQuery({
    id: Number(contest.id),
    chainId: activeChain.id,
  }, {
    enabled: !!contest.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  const contract = getContract({
    client,
    address: CONTESTS[activeChain.id]!,
    chain: activeChain,
  });

  const tx = prepareContractCall({
    contract,
    method: "function joinContest(uint256 id)",
    params: [BigInt(contest.id)],
  });

  const label = contest.isInviteOnly ? "Request to join" : "Join";
  const onSubmitAlert = contest.isInviteOnly ? "Requesting to join..." : "Joining...";
  const onReceiptAlert = contest.isInviteOnly ? "Request to join sent!" : "Joined!";

  if (!account) {
    return (
      <ProfileButton loginBtnLabel="Login to join" />
    )
  }

  if (contest.contestants.includes(account?.address)) {
    return null;
  }

  if (joinRequests?.includes(account?.address)) {
    return (
      <button className="btn" disabled>
        Request to Join Is Pending
      </button>
    )
  }
  
  return (
    <TransactionButton
      waitForReceipt
      transaction={() => tx}
      onSubmitted={() => {
        toast.info(onSubmitAlert);
      }}
      onReceipt={() => {
        toast.dismiss();
        toast.success(onReceiptAlert);
        onContestJoined?.(Number(contest.id));
      }}
      onError={(e) => {
        toast.error(e.message);
      }}
    >
      {label}
    </TransactionButton>
  )
};

export default JoinContest;
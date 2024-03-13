import { useContext, type FC } from "react";
import { client } from "~/providers/Thirdweb";
import { getContract, prepareContractCall } from "thirdweb";
import { CONTESTS } from "~/constants/addresses";
import { toast } from "react-toastify";
import { TransactionButton } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";

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
  requesterAddress: string;
  onRequestRejected?: (contestId: number) => void;
}
export const RejectJoinRequest: FC<Props> = ({ contest, requesterAddress, onRequestRejected }) => {
  const { activeChain } = useContext(ActiveChainContext);
  
  const contract = getContract({
    client,
    address: CONTESTS[activeChain.id]!,
    chain: activeChain,
  });

  const tx = prepareContractCall({
    contract,
    method: "function denyJoinRequest(uint256 id, address participant)",
    params: [BigInt(contest.id), requesterAddress],
  });

  return (
    <TransactionButton
      transaction={() => tx}
      onSubmitted={() => {
        toast.info("Rejecting...");
      }}
      onReceipt={() => {
        toast.dismiss();
        toast.success("Rejected!");
        onRequestRejected?.(Number(contest.id));
      }}
      onError={(e) => {
        toast.error(e.message);
      }}
    >
      Reject
    </TransactionButton>
  )
}

export default RejectJoinRequest;
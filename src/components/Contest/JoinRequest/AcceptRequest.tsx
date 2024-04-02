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
  onRequestAccepted?: (contestId: number) => void;
}
export const AcceptJoinRequest: FC<Props> = ({ contest, requesterAddress, onRequestAccepted }) => {
  const { activeChain } = useContext(ActiveChainContext);
  
  const contract = getContract({
    client,
    address: CONTESTS[activeChain.id]!,
    chain: activeChain,
  });

  const tx = prepareContractCall({
    contract,
    method: "function acceptJoinRequest(uint256 id, address participant)",
    params: [BigInt(contest.id), requesterAddress],
  });

  return (
    <TransactionButton
      transaction={() => tx}
      onTransactionSent={() => {
        toast.info("Accepting...");
      }}
      onTransactionConfirmed={() => {
        toast.dismiss();
        toast.success("Accepted!");
        onRequestAccepted?.(Number(contest.id));
      }}
      onError={(e) => {
        toast.error(e.message);
      }}
    >
      Accept
    </TransactionButton>
  )
}

export default AcceptJoinRequest;
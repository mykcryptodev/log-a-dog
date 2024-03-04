import Image from "next/image";
import { useContext, type FC } from "react";
import { toast } from "react-toastify";
import { getContract, prepareContractCall } from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import { CONTESTS } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";

type Props = {
  contestId: number;
  contestantToRemove: {
    address: string;
    username: string;
    imgUrl: string;
    metadata?: string;
  };
  onContestantRemoved?: (contestant: {
    address: string;
    username: string;
    imgUrl: string;
    metadata?: string;
  }) => void;
}
export const RemoveContestant: FC<Props> = ({ 
  contestId, 
  contestantToRemove, 
  onContestantRemoved 
}) => {
  const { activeChain } = useContext(ActiveChainContext);
  
  const contract = getContract({
    client,
    address: CONTESTS[activeChain.id]!,
    chain: activeChain,
  });

  const tx = prepareContractCall({
    contract,
    method: "function removeFromContest(uint256 id, address contestant)",
    params: [BigInt(contestId), contestantToRemove.address],
  });
  
  return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button className="btn btn-xs btn-circle btn-ghost mr-4" onClick={()=>(document.getElementById(`remove_contestants_modal_${contestantToRemove.address}`) as HTMLDialogElement).showModal()}>
      &times;
      </button>
      <dialog id={`remove_contestants_modal_${contestantToRemove.address}`} className="modal">
        <div className="modal-box relative">
          <button 
            className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4"
            onClick={()=>(document.getElementById(`remove_contestants_modal_${contestantToRemove.address}`) as HTMLDialogElement).close()}
          >
            &times;
          </button>
          <h3 className="font-bold text-2xl mb-4">Are you sure?</h3>
          <div className="flex items-center gap-1">
            <span>Are you sure you want to remove</span>
            <div className="flex items-center gap-1">
              <Image
                src={contestantToRemove.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/")}
                width={24}
                height={24}
                className="rounded-full"
                alt="profile"
              />
              <span>{contestantToRemove.username}</span>
            </div> 
            <span>from the contest?</span>
          </div>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
            <TransactionButton
              className="btn btn-error"
              transaction={() => tx}
              onSubmitted={() => {
                toast.info("Removing...");
                // TODO: onReceipt should be called after the transaction is confirmed then we can remove the setTimeout
                // wait 5 seconds
                setTimeout(() => {
                  onContestantRemoved?.(contestantToRemove);
                }, 5000);
                // close the modal
                (document.getElementById(`remove_contestants_modal_${contestantToRemove.address}`) as HTMLDialogElement).close();
              }}
              onError={(e) => {
                toast.error(e.message);
                // close the modal
                (document.getElementById(`remove_contestants_modal_${contestantToRemove.address}`) as HTMLDialogElement).close();
              }}
              onReceipt={() => {
                toast.success("Contestant removed");
                (document.getElementById(`remove_contestants_modal_${contestantToRemove.address}`) as HTMLDialogElement).close();
              }}
            >
              Remove
            </TransactionButton>
          </div>
        </div>
      </dialog>
    </>
  )
};
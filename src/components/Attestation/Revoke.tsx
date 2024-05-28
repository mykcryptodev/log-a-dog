import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState, type FC, useContext } from "react";
import { toast } from "react-toastify";
import { getContract, sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { LOG_A_DOG } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import { revokeHotdogLog } from "~/thirdweb/84532/0x1bf5c7e676c8b8940711613086052451dcf1681d";

type Props = {
  hotdog: {
    logId: bigint;
    eater: string;
  }
  onRevocation?: () => void;
}

export const Revoke: FC<Props> = ({ hotdog, onRevocation }) => {
  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const revoke = async () => {
    if (!account) {
      return toast.error("You must login to revoke attestations!");
    }
    const transaction = revokeHotdogLog({
      contract: getContract({
        chain: activeChain,
        address: LOG_A_DOG[activeChain.id]!,
        client,
      }),
      logId: hotdog.logId,
    });

    setIsLoading(true);
    try {
      await sendTransaction({ transaction, account });
      toast.success("Attestation revoked!");
      onRevocation?.();
    } catch (e) {
      console.error(e);
      const error = e as Error;
      toast.error(`Failed to revoke attestation: ${error.message}`);
    } finally {
      setIsLoading(false);
      // close the modal
      const modal = document.getElementById(`${hotdog.logId}-revoke-modal`) as HTMLInputElement;
      if (modal) {
        modal.checked = false;
      }
    }
  };

  return (
    <>
      {hotdog.eater.toLowerCase() === account?.address.toLowerCase() && (
        <label htmlFor={`${hotdog.logId}-revoke-modal`} className="btn btn-xs btn-circle btn-ghost w-fit px-2">
          <TrashIcon className="w-4 h-4" />
        </label>
      )}
      {/* Put this part before </body> tag */}
      <input type="checkbox" id={`${hotdog.logId}-revoke-modal`} className="modal-toggle" />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <label htmlFor={`${hotdog.logId}-revoke-modal`} className="btn btn-ghost btn-xs btn-circle absolute top-0 right-0 m-4">
            <XMarkIcon className="w-4 h-4" />
          </label>
          <h3 className="font-bold text-lg">Hold up!</h3>
          <p className="py-4">Are you sure you want to remove this logged dog? Nobody can undo this action.</p>
          <div className="modal-action">
            <label htmlFor={`${hotdog.logId}-revoke-modal`} className="btn">Whoops, nevermind!</label>
            <button 
              className="btn btn-error"
              disabled={isLoading}
              onClick={() => revoke()}
            >
              {isLoading && (
                <div className="loading loading-spinner" />
              )}
              Get rid of it!
            </button>
          </div>
        </div>
      </div>
    </>
  )
};

export default Revoke;
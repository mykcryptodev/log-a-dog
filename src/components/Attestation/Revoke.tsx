import { useContext, type FC, useState } from "react";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { EAS as EAS_ADDRESS, EAS_SCHEMA_ID } from "~/constants/addresses";
import { EAS, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { client } from "~/providers/Thirdweb";
import { toast } from "react-toastify";
import { TrashIcon } from "@heroicons/react/24/outline";

type Props = {
  uid: string;
  onAttestationRevoked?: () => void;
}

export const RevokeAttestation: FC<Props> = ({ uid, onAttestationRevoked }) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { activeChain } = useContext(ActiveChainContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const revoke = async () => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      toast.error("Failed to remove dog!");
      (document.getElementById(`revoke_attestation_modal_${uid}`) as HTMLDialogElement).close();
      return;
    }
    const schemaUid = EAS_SCHEMA_ID[activeChain.id]!;
    const easContractAddress = EAS_ADDRESS[activeChain.id]!;
    const eas = new EAS(easContractAddress);
    const signer = await ethers6Adapter.signer.toEthers(client, account, activeChain) as TransactionSigner;

    try {
      setIsLoading(true);
      eas.connect(signer);
      const transaction = await eas.revoke({
        schema: schemaUid,
        data: { uid },
      });
      const result = await transaction.wait();
      console.log({ result });
      onAttestationRevoked?.();
      toast.success("Dog has been removed!");
    } catch (e) {
      // pop notification
      console.error(e);
      toast.error("Failed to remove dog!");
    } finally { 
      setIsLoading(false);
      // close modal
      (document.getElementById(`revoke_attestation_modal_${uid}`) as HTMLDialogElement).close();
    }
  };
  return (
    <>
      <button 
        className="btn btn-xs btn-ghost w-fit" 
        onClick={()=>(document.getElementById(`revoke_attestation_modal_${uid}`) as HTMLDialogElement).showModal()}
      >
        <TrashIcon className="w-4 h-4" />
      </button>
      <dialog id={`revoke_attestation_modal_${uid}`} className="modal">
        <div className="modal-box overflow-hidden">
          <h3 className="font-bold text-2xl mb-4">Remove Dog {uid.slice(-5)} </h3>
          <div className="flex flex-col gap-2">
            <p>Are you sure you want to remove this dog?</p>
          </div>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
            <button 
              className="btn btn-primary" 
              disabled={isLoading}
              onClick={() => void revoke()}
            >
              {isLoading && <div className="loading loading-spinner" />}
              Remove
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
};

export default RevokeAttestation;
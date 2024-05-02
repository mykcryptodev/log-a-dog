import { EAS, SchemaEncoder, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { type FC,useContext, useState } from 'react';
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { EAS as EAS_ADDRESS, EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import Upload from "~/components/utils/Upload";
import { toast } from "react-toastify";
import JSConfetti from 'js-confetti';
import { ProfileButton } from "~/components/Profile/Button";
import { api } from "~/utils/api";
import Connect from "~/components/utils/Connect";
import { getRpcClient, eth_maxPriorityFeePerGas, } from "thirdweb/rpc";

type Props = {
  onAttestationCreated?: (attestation: {
    hotdogEater: string;
    imageUri: string;
    metadata?: string;
  }) => void;
}
export const CreateAttestation: FC<Props> = ({ onAttestationCreated }) => {
  const [imgUri, setImgUri] = useState<string>("");

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { activeChain } = useContext(ActiveChainContext);
  const { data: profile, refetch: refetchProfile } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  const schemaUid = EAS_SCHEMA_ID[activeChain.id]!;
  const easContractAddress = EAS_ADDRESS[activeChain.id]!;
  const eas = new EAS(easContractAddress);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const rpcRequest = getRpcClient({ client, chain: activeChain });

  const create = async () => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      toast.error("You must login to log dogs");
      return;
    }
    const signer = await ethers6Adapter.signer.toEthers({ client, account, chain: activeChain }) as TransactionSigner;

    // get the signer from ethers
    const schemaEncoder = new SchemaEncoder("string image_uri,string metadata");
    const encodedData = schemaEncoder.encodeData([
      { name: "image_uri", value: imgUri, type: "string"},
      { name: "metadata", value: "", type: "string" }
    ]);
    console.log({ imgUri });
    try {
      setIsLoading(true);
      eas.connect(signer);
      const maxPriorityFeePerGas = await eth_maxPriorityFeePerGas(rpcRequest);
      await eas.attest({
        schema: schemaUid,
        data: {
          recipient: account.address,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      }, {
        maxPriorityFeePerGas,
      });
      onAttestationCreated?.({
        hotdogEater: account.address,
        imageUri: imgUri,
      });
      toast.success("Dog has been logged!");
      (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      canvas.style.display = 'block';
      const jsConfetti = new JSConfetti({ canvas });
      await jsConfetti.addConfetti({
        emojis: ['🌭', '🎉', '🌈', '✨']
      });
      canvas.style.display = 'none';
    } catch (e) {
      // pop notification
      console.error(e);
      toast.error("Failed to log dog, try logging out and logging back in!");
    } finally { 
      setIsLoading(false);
      // close modal
      (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
    }
  };

  const ActionButton: FC = () => {
    if (!account) return (
      <div onClick={() => (document.getElementById('create_attestation_modal') as HTMLDialogElement).close() }>
        <Connect loginBtnLabel="Login to Log Dogs" />
      </div>
    )
    if (!profile?.username) return (
      <ProfileButton
        onProfileCreated={() => void refetchProfile()}
      />
    );

    return (
      <button 
        className="btn btn-primary" 
        disabled={isLoading}
        onClick={() => void create()}
      >
        {isLoading && <div className="loading loading-spinner" />}
        Log a Dog
      </button>
    )
  };

  return (
    <>
      <canvas 
        className="absolute top-0 left-0 hidden" 
        id="confetti-canvas"
        style={{
          height: '100vh',
          width: '100vw',
        }}
      />
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button 
        className="btn btn-primary btn-lg" 
        onClick={()=>(document.getElementById('create_attestation_modal') as HTMLDialogElement).showModal()}
      >
        Log a Dog
      </button>
      <dialog id="create_attestation_modal" className="modal">
        <div className="modal-box overflow-hidden">
          <h3 className="font-bold text-2xl mb-4">Log a Dog</h3>
          <div className="flex flex-col gap-2">
            <Upload 
              onUpload={({ uris }) => {
                if (!uris) return;
                setImgUri(uris[0]!);
              }}
              onUploadError={() => {
                // close the modal
                (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
              }}
              label="📷 Take a picture of you eating it!"
            />
            <span className="text-center text-xs opacity-50">
              Images uploaded here are public and will be displayed on the global leaderboard
            </span>
          </div>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
            <ActionButton />
          </div>
        </div>
      </dialog>
    </>
  )
};
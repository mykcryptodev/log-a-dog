import { EAS, SchemaEncoder, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { type FC,useContext, useState } from 'react';
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { EAS as EAS_ADDRESS, EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import Upload from "~/components/utils/Upload";
import { toast } from "react-toastify";
import JSConfetti from 'js-confetti';
import { ProfileButton } from "~/components/Profile/Button";
import { api } from "~/utils/api";

type Props = {
  onAttestationCreated?: (attestation: {
    hotdogEater: string;
    numHotdogsEaten: number;
    imageUri: string;
    metadata?: string;
  }) => void;
}
export const CreateAttestation: FC<Props> = ({ onAttestationCreated }) => {
  const [numHotdogs] = useState<number>(1);
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

  const create = async () => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const signer = await ethers6Adapter.signer.toEthers(client, wallet) as TransactionSigner;

    // get the signer from ethers
    const schemaEncoder = new SchemaEncoder("address hotdog_eater,uint256 num_hotdogs_eaten,string image_uri,string metadata");
    const encodedData = schemaEncoder.encodeData([
      { name: "hotdog_eater", value: account.address, type: "address" },
      { name: "num_hotdogs_eaten", value: numHotdogs, type: "uint256" },
      { name: "image_uri", value: imgUri, type: "string"},
      { name: "metadata", value: "", type: "string" }
    ]);
    try {
      setIsLoading(true);
      eas.connect(signer);
      await eas.attest({
        schema: schemaUid,
        data: {
          recipient: account.address,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      });
      onAttestationCreated?.({
        hotdogEater: account.address,
        numHotdogsEaten: numHotdogs,
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
      toast.error("Failed to log dog");
    } finally { 
      setIsLoading(false);
      // close modal
      (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
    }
  };

  const ActionButton: FC = () => {
    if (!account) return (
      <div onClick={() => (document.getElementById('create_attestation_modal') as HTMLDialogElement).close() }>
        <ConnectButton
          connectButton={{
            label: "Login to Log Dogs"
          }}
        />
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
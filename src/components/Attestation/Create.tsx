import { type FC,useContext, useState, useMemo } from 'react';
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { LOG_A_DOG } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import { toast } from "react-toastify";
import JSConfetti from 'js-confetti';
import { ProfileButton } from "~/components/Profile/Button";
import { api } from "~/utils/api";
import Connect from "~/components/utils/Connect";
import { getContract, sendTransaction } from "thirdweb";
import { logHotdog } from "~/thirdweb/84532/0x1bf5c7e676c8b8940711613086052451dcf1681d";
import dynamic from 'next/dynamic';
import { sendCalls, useCapabilities } from "thirdweb/wallets/eip5792";

const Upload = dynamic(() => import('~/components/utils/Upload'), { ssr: false });

type Props = {
  onAttestationCreated?: (attestation: {
    hotdogEater: string;
    imageUri: string;
    metadata?: string;
  }) => void;
}
export const CreateAttestation: FC<Props> = ({ onAttestationCreated }) => {
  const [imgUri, setImgUri] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const wallet = useActiveWallet();
  const { data: walletCapabilities } = useCapabilities();

  const isDisabled = useMemo(() => {
    return !imgUri || !wallet || isLoading;
  }, [imgUri, isLoading, wallet]);

  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const { data: profile, refetch: refetchProfile } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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

    const logDog = async () => {
      if (!wallet) {
        return toast.error("You must login to attest to dogs!");
      }
      if (isDisabled) return;
      setIsLoading(true);
      try {
        const transaction = logHotdog({
          contract: getContract({
            address: LOG_A_DOG[activeChain.id]!,
            client,
            chain: activeChain,
          }),
          imageUri: imgUri!,
          metadataUri: "",
          eater: account.address
        });
        const chainIdAsHex = activeChain.id.toString(16) as unknown as number;
        if (walletCapabilities?.[chainIdAsHex]) {
          await sendCalls({
            chain: activeChain,
            wallet,
            calls: [transaction],
          });
        } else {
          await sendTransaction({
            account: wallet.getAccount()!,
            transaction,
          });
        }
        toast.success("Dog has been logged!");
        // pop confetti
        (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
        const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
        canvas.style.display = 'block';
        const jsConfetti = new JSConfetti({ canvas });
        await jsConfetti.addConfetti({
          emojis: ['🌭', '🎉', '🌈', '✨']
        });
        canvas.style.display = 'none';
        (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
        setImgUri(undefined);
      } catch (error) {
        const e = error as Error;
        console.error(error);
        toast.error(`Attestation failed: ${e.message}`);
      } finally {
        setIsLoading(false);
        void onAttestationCreated?.({
          hotdogEater: account.address,
          imageUri: imgUri!,
        });
      }
    };

    return (
      <button
        className="btn btn-primary"
        onClick={logDog}
        disabled={isDisabled}
      >
        {isLoading && (
          <div className="loading loading-spinner" />
        )}
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
                setImgUri(uris[0]);
              }}
              initialUrls={imgUri ? [imgUri] : undefined}
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
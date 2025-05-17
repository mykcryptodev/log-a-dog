import { type FC,useContext, useState, useMemo } from 'react';
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { toast } from "react-toastify";
import JSConfetti from 'js-confetti';
import Connect from "~/components/utils/Connect";
import dynamic from 'next/dynamic';
import { api } from "~/utils/api";
import { TransactionStatus } from '../utils/TransactionStatus';

const Upload = dynamic(() => import('~/components/utils/Upload'), { ssr: false });

type Props = {
  onAttestationCreated?: (attestation: {
    hotdogEater: string;
    imageUri: string;
    metadata?: string;
  }) => void;
}
export const CreateAttestation: FC<Props> = ({ onAttestationCreated }) => {
  const { mutateAsync: logHotdog } = api.hotdog.log.useMutation();
  const utils = api.useUtils();
  const [imgUri, setImgUri] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const wallet = useActiveWallet();

  const isDisabled = useMemo(() => {
    return !imgUri || !wallet || isLoading;
  }, [imgUri, isLoading, wallet]);

  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const [isTransactionIdResolved, setIsTransactionIdResolved] = useState<boolean>(false);

  const handleOnResolved = (success: boolean) => {
    if (success && account) {
      // pop confetti
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      canvas.style.display = 'block';
      const jsConfetti = new JSConfetti({ canvas });
      void jsConfetti.addConfetti({
        emojis: ['🌭', '🎉', '🌈', '✨']
      }).then(() => {
        // Hide the canvas after confetti animation completes
        setTimeout(() => {
          canvas.style.display = 'none';
        }, 3000);
      });

      void onAttestationCreated?.({
        hotdogEater: account.address,
        imageUri: imgUri!,
      });

      // Invalidate the hotdog query cache
      void utils.hotdog.getAll.invalidate();
    }
    setIsTransactionIdResolved(true);
  }

  const ActionButton: FC = () => {
    if (!account) return (
      <div onClick={() => (document.getElementById('create_attestation_modal') as HTMLDialogElement).close() }>
        <Connect loginBtnLabel="Login to Log Dogs" />
      </div>
    )

    const logDog = async () => {
      if (!wallet) {
        return toast.error("You must login to attest to dogs!");
      }
      if (isDisabled) return;
      setIsLoading(true);
      try {
        // Reset the transaction resolution state for new logs
        setIsTransactionIdResolved(false);
        // Call the backend tRPC procedure
        const transactionId = await logHotdog({
          chainId: activeChain.id,
          imageUri: imgUri!,
          metadataUri: '',
        });
        setTransactionId(transactionId);

        // close the modal
        (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
        setImgUri(undefined);
      } catch (error) {
        const e = error as Error;
        console.error(error);
        toast.error(`Attestation failed: ${e.message}`);
      } finally {
        setIsLoading(false);
        // close the modal
        (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
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
        className="fixed top-0 left-0 hidden" 
        id="confetti-canvas"
        style={{
          height: '100vh',
          width: '100vw',
          zIndex: 9999,
          pointerEvents: 'none'
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
      {transactionId && !isTransactionIdResolved && (
        <TransactionStatus 
          onResolved={handleOnResolved} 
          transactionId={transactionId} 
          loadingMessages={[
            { message: "Beaming dog into space..." },
            { message: "Guzzlin glizzy into the blockchain..."},
            { message: "Suckin down analytics..." },
            { message: "Logging dog..." },
          ]}
          successMessage="You logged a dog!"
          errorMessage="Failed to log your dog"
        />
      )}
    </>
  )
};
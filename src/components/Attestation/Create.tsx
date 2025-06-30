import { type FC, useContext, useState, useMemo, useEffect } from 'react';
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { toast } from "react-toastify";
import JSConfetti from 'js-confetti';
import Connect from "~/components/utils/Connect";
import dynamic from 'next/dynamic';
import { api } from "~/utils/api";
import { TransactionStatus } from '../utils/TransactionStatus';
import { DEFAULT_UPLOAD_PHRASE } from '~/constants';
import { FarcasterContext } from "~/providers/Farcaster";
import { sdk } from "@farcaster/frame-sdk";
import { usePendingTransactionsStore } from "~/stores/pendingTransactions";

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
  const { addPendingDog, removePendingDog } = usePendingTransactionsStore();
  const [imgUri, setImgUri] = useState<string | undefined>();
  const [lastLoggedImgUri, setLastLoggedImgUri] = useState<string | undefined>();
  const [lastLoggedDescription, setLastLoggedDescription] = useState<string>('');
  const [lastLoggedTransactionHash, setLastLoggedTransactionHash] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const wallet = useActiveWallet();

  const isDisabled = useMemo(() => {
    return !imgUri || !wallet || isLoading;
  }, [imgUri, isLoading, wallet]);

  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const [transactionHash, setTransactionHash] = useState<string | undefined>();
  const [isTransactionIdResolved, setIsTransactionIdResolved] = useState<boolean>(false);

  // Query for dog event when we have a transaction hash
  const { data: dogEvent } = api.hotdog.getDogEventByTransactionHash.useQuery(
    { transactionHash: transactionHash! },
    { enabled: !!transactionHash && isTransactionIdResolved }
  );

  // Show share dialog when dog event is loaded
  useEffect(() => {
    if (isMiniApp && dogEvent && isTransactionIdResolved) {
      const dialog = document.getElementById('share_cast_modal') as HTMLDialogElement;
      dialog?.showModal();
    }
  }, [isMiniApp, dogEvent, isTransactionIdResolved]);

  const handleOnResolved = (success: boolean) => {
    if (success && account && transactionId) {
      // Keep the optimistic data - don't remove it here
      // Let it be naturally filtered out when real data appears
      
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

      // Just do a gentle invalidation - no forced refetch
      console.log('🔄 Transaction resolved, gentle cache invalidation');
      void utils.hotdog.getAll.invalidate();
      
    } else if (!success && transactionId) {
      // If transaction failed, remove the optimistic update
      removePendingDog(transactionId);
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
        // Reset state for new logs
        setTransactionId(undefined);
        setIsTransactionIdResolved(false);
        // Call the backend tRPC procedure
        const result = await logHotdog({
          chainId: activeChain.id,
          imageUri: imgUri!,
          metadataUri: '',
          description,
        });
        
        // Add optimistic update to store
        addPendingDog({
          ...result.optimisticData,
          transactionId: result.transactionId,
          createdAt: Date.now(),
        });
        
        setLastLoggedImgUri(imgUri);
        setLastLoggedDescription(description);
        setTransactionId(result.transactionId);

        // Trigger immediate UI update
        void onAttestationCreated?.({
          hotdogEater: account.address,
          imageUri: imgUri!,
        });

        // close the modal
        (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
        setImgUri(undefined);
        setDescription('');
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

  const shareOnFarcaster = async () => {
    try {
      if (!dogEvent) {
        toast.error("Dog details not found yet. Please try again.");
        return;
      }
      
      const dogUrl = `https://logadog.xyz/dog/${dogEvent.logId}`;
      const shareText = lastLoggedDescription.trim() || 'Just logged a dog on Log a Dog!';
      
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [dogUrl],
      });
    } catch (err) {
      console.error('Failed to compose cast', err);
    } finally {
      (document.getElementById('share_cast_modal') as HTMLDialogElement)?.close();
    }
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
        className="btn btn-primary" 
        onClick={()=>(document.getElementById('create_attestation_modal') as HTMLDialogElement).showModal()}
      >
        Log a Dog
      </button>
      <button 
        className="btn btn-primary text-4xl btn-circle btn-lg fixed bottom-24 right-6 z-50 shadow-xl shadow-pink-500/75" 
        style={{ filter: 'drop-shadow(0 -9px 19px rgba(236, 72, 153, 0.75)) drop-shadow(0 -6px 15px rgba(254, 240, 138, 0.5))' }}
        onClick={()=>(document.getElementById('create_attestation_modal') as HTMLDialogElement).showModal()}
      >
        🌭
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
              label={DEFAULT_UPLOAD_PHRASE}
            />
            <span className="text-center text-xs opacity-50">
              Images uploaded here are public and will be displayed on the global leaderboard
            </span>
            <div className="collapse collapse-arrow w-full bg-base-200 bg-opacity-30">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                Advanced
              </div>
              <div className="collapse-content">
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Add a message to your dog"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
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
          onTransactionHash={setTransactionHash}
          loadingMessages={[
            { message: "Beaming dog into space..." },
            { message: "Guzzlin glizzy into the blockchain..."},
            { message: "Mining meat into a block..." },
            { message: "Slathering on the 'sturd..."},
            { message: "Suckin down analytics..." },
            { message: "Downloading the dinger..."},
            { message: "Logging dog..." },
          ]}
          successMessage="You logged a dog!"
          errorMessage="Failed to log your dog"
        />
      )}
      <dialog id="share_cast_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-opacity-50 backdrop-blur-lg">
          <h3 className="font-bold text-lg">Share on Farcaster?</h3>
          <p className="py-4">Would you like to share your logged dog on Farcaster?</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">No thanks</button>
            </form>
            <button className="btn btn-primary" onClick={shareOnFarcaster}>Share</button>
          </div>
        </div>
      </dialog>
    </>
  )
};
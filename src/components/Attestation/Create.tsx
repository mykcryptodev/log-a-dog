/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { type FC, useContext, useState, useMemo, useEffect } from 'react';
import { ConnectButton, TransactionButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { toast } from "react-toastify";
import JSConfetti from 'js-confetti';
import dynamic from 'next/dynamic';
import { api } from "~/utils/api";
import { TransactionStatus } from '../utils/TransactionStatus';
import { DEFAULT_CHAIN, DEFAULT_UPLOAD_PHRASE, LOG_A_DOG } from '~/constants';
import { FarcasterContext } from "~/providers/Farcaster";
import { sdk } from "@farcaster/frame-sdk";
import { usePendingTransactionsStore } from "~/stores/pendingTransactions";
import { logHotdog as logHotdogBase } from '~/thirdweb/8453/0x6cfb88c8d0d7ffc563155e13c62b4fa17bc25974';
import { getContract } from 'thirdweb';
import { client } from '~/providers/Thirdweb';
import { upload } from 'thirdweb/storage';
import { encodePoolConfig } from '~/server/utils/poolConfig';

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
  const [payOwnGas, setPayOwnGas] = useState<boolean>(false);
  const wallet = useActiveWallet();
  const [coinMetadataUri, setCoinMetadataUri] = useState<string | undefined>();

  // Debounced upload effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!imgUri) return;
      
      const coinMetadata = {
        name: "Logged Dog",
        description: description && description.trim() !== '' ? description : "Logging dogs onchain",
        image: imgUri,
        properties: {
          category: "social",
        },
      };
      
      try {
        const uploadedUri = await upload({
          client,
          files: [coinMetadata],
        });
        setCoinMetadataUri(uploadedUri);
      } catch (error) {
        console.error('Failed to upload coin metadata:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [description, imgUri]);

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

  // Remove the optimistic dog once the real data is available
  useEffect(() => {
    if (dogEvent && transactionId) {
      removePendingDog(transactionId);
    }
  }, [dogEvent, transactionId, removePendingDog]);

  const handleOnResolved = (success: boolean) => {
    if (success && account && transactionId) {
      // Keep the optimistic data - don't remove it here
      // Let it be naturally filtered out when real data appears

      // Invalidate cached queries so lists update when the new dog appears
      console.log('🔄 Transaction resolved, invalidating caches');
      void utils.hotdog.getAll.invalidate();
      void utils.hotdog.getAllForUser.invalidate();
      void utils.hotdog.getLeaderboard.invalidate();

    } else if (!success && transactionId) {
      // If transaction failed, remove the optimistic update
      removePendingDog(transactionId);
    }
    setIsTransactionIdResolved(true);
  }

  const ActionButton: FC = () => {
    if (!account) return (
      <button className="btn btn-secondary flex-1" disabled>
        Connect Wallet
      </button>
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

        // pop confetti immediately for dopamine hit
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
        className="btn btn-primary flex-1"
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

  const getTx = useMemo(() => {
    console.log({ coinMetadataUri, imgUri, account });
    return async () => {
      if (!imgUri) {
        toast.error("Please upload an image to log a dog");
        throw new Error("No image uploaded");
      }
      
      if (!account || !coinMetadataUri) {
        toast.error("Please connect your wallet");
        throw new Error("No wallet connected");
      }
      
      const poolConfig = encodePoolConfig();

      return logHotdogBase({
        contract: getContract({
          address: LOG_A_DOG[DEFAULT_CHAIN.id]!,
          chain: DEFAULT_CHAIN,
          client,
        }),
        imageUri: imgUri!,
        metadataUri: '',
        eater: account.address,
        coinUri: coinMetadataUri,
        poolConfig,
      });
    };
  }, [imgUri, description, account, coinMetadataUri]);

  const handleOnSuccess = () => {
    // pop confetti immediately for dopamine hit
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

    setLastLoggedImgUri(imgUri);
    setLastLoggedDescription(description);

    // Trigger immediate UI update
    void onAttestationCreated?.({
      hotdogEater: account!.address,
      imageUri: imgUri!,
    });

    // close the modal
    (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
    setImgUri(undefined);
    setDescription('');
  }

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
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text text-xs">I will pay my own blockchain fees</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={payOwnGas}
                  onChange={(e) => setPayOwnGas(e.target.checked)}
                />
              </label>
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
            <div className="flex flex-col gap-2">
              {!account ? (
                <ConnectButton client={client} />
              ) : payOwnGas ? (
                <TransactionButton
                  className="!btn !btn-primary flex-1"
                  transaction={getTx}
                  onTransactionConfirmed={handleOnSuccess}
                  disabled={!imgUri}
                >
                  Log a Dog
                </TransactionButton>
              ) : (
                <ActionButton />
              ) }
            </div>
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
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { type FC, useContext, useState, useMemo, useEffect, memo, useRef } from 'react';
import { ConnectButton, TransactionButton, useActiveWallet } from "thirdweb/react";
import { toast } from "react-toastify";
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
import { useStableAccount, useStableWallet } from '~/hooks/useStableAccount';

const Upload = dynamic(() => import('~/components/utils/Upload'), { ssr: false });

// Confetti only fires after a user logs a dog, so the library is loaded lazily
// on demand rather than shipped in the homepage bundle. See React rule
// `bundle-conditional`.
const fireConfetti = async () => {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const { default: JSConfetti } = await import('js-confetti');
  canvas.style.display = 'block';
  const jsConfetti = new JSConfetti({ canvas });
  void jsConfetti
    .addConfetti({ emojis: ['🌭', '🎉', '🌈', '✨'] })
    .then(() => {
      // Hide the canvas after confetti animation completes
      setTimeout(() => {
        canvas.style.display = 'none';
      }, 3000);
    });
};

type Props = {
  onAttestationCreated?: (attestation: {
    hotdogEater: string;
    imageUri: string;
    metadata?: string;
  }) => void;
  // When false, the component renders only the modal/canvas/status machinery
  // (no inline "Log a Dog" button or FAB). Used by the global BottomNav, which
  // owns the single ceremonial Log action. See REDESIGN §2.
  showTriggers?: boolean;
}
const CreateAttestationComponent: FC<Props> = ({ onAttestationCreated, showTriggers = true }) => {
  const { mutateAsync: logHotdog } = api.hotdog.log.useMutation();
  const { mutateAsync: indexAfterLog } = api.indexer.refreshFeed.useMutation();
  const utils = api.useUtils();
  const { addPendingDog, removePendingDog } = usePendingTransactionsStore();
  const [imgUri, setImgUri] = useState<string | undefined>();
  const [lastLoggedImgUri, setLastLoggedImgUri] = useState<string | undefined>();
  const [lastLoggedDescription, setLastLoggedDescription] = useState<string>('');
  const [lastLoggedTransactionHash, setLastLoggedTransactionHash] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [payOwnGas, setPayOwnGas] = useState<boolean>(false);
  const wallet = useActiveWallet(); // Keep for transaction functionality
  const stableWallet = useStableWallet(); // Use for renders
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

  const walletExists = !!stableWallet?.exists;
  const isDisabled = useMemo(() => {
    return !imgUri || !walletExists || isLoading;
  }, [imgUri, isLoading, walletExists]);

  const account = useStableAccount();
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const [transactionHash, setTransactionHash] = useState<string | undefined>();
  const [isTransactionIdResolved, setIsTransactionIdResolved] = useState<boolean>(false);

  const initialUrlsRef = useRef<string[] | undefined>();
  const memoInitialUpload = useMemo(() => {
    if (!imgUri) {
      initialUrlsRef.current = undefined;
      return undefined;
    }
    // Only create new array if the content has actually changed
    if (!initialUrlsRef.current || initialUrlsRef.current[0] !== imgUri) {
      initialUrlsRef.current = [imgUri];
    }
    return initialUrlsRef.current;
  }, [imgUri]);

  // Query for dog event when we have a transaction hash
  const { data: dogEvent } = api.hotdog.getDogEventByTransactionHash.useQuery(
    { transactionHash: transactionHash! },
    {
      enabled: !!transactionHash && isTransactionIdResolved,
      onSuccess: () => {
        if (transactionId) {
          removePendingDog(transactionId);
        }
      },
    }
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

      // The on-chain tx is mined; pull it into the DB read-model via the
      // CDP-backed indexer (it waits for CDP to have the tx), then refresh.
      void indexAfterLog({
        chainId: DEFAULT_CHAIN.id,
        transactionHash,
      })
        .catch(() => undefined)
        .finally(() => {
          void Promise.all([
            utils.hotdog.getAll.invalidate(),
            utils.hotdog.getAllForUser.invalidate(),
            utils.hotdog.getLeaderboard.invalidate(),
          ]);
        });

    } else if (!success && transactionId) {
      // If transaction failed, remove the optimistic update
      removePendingDog(transactionId);
    }
    setIsTransactionIdResolved(true);
  }

  // Hoisted out of render rather than defined as an inline `<ActionButton />`
  // component. Defining a component inside another component gives it a new
  // identity on every render, which forces React to unmount/remount its
  // subtree and discard its state. See React rule `rerender-no-inline-components`.
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
        chainId: DEFAULT_CHAIN.id,
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
      void fireConfetti();

      setLastLoggedImgUri(imgUri);
      setLastLoggedDescription(description);
      setTransactionId(result.transactionId);

      // Trigger immediate UI update
      void onAttestationCreated?.({
        hotdogEater: account!.address,
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

  const accountAddress = account?.address;
  const getTx = useMemo(() => {
    return async () => {
      if (!imgUri) {
        toast.error("Please upload an image to log a dog");
        throw new Error("No image uploaded");
      }
      
      if (!accountAddress || !coinMetadataUri) {
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
        eater: accountAddress,
        coinUri: coinMetadataUri,
        poolConfig,
      });
    };
  }, [imgUri, accountAddress, coinMetadataUri]);

  const handleOnSuccess = () => {
    // pop confetti immediately for dopamine hit
    void fireConfetti();

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
      {/* Inline trigger kept for legacy embeds; the global BottomNav now owns
          the primary Log action and renders this component with showTriggers=false. */}
      {showTriggers && (
        <button
          className="pop-btn btn btn-primary font-display tracking-wide"
          onClick={()=>(document.getElementById('create_attestation_modal') as HTMLDialogElement).showModal()}
        >
          Log a Dog
        </button>
      )}
      <dialog id="create_attestation_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-h-[92vh] overflow-y-auto border-[3px] border-base-content bg-base-100">
          <h3 className="mb-1 font-display text-3xl tracking-wide">LOG A DOG 🌭</h3>
          <p className="mb-4 text-sm opacity-70">Show us the evidence.</p>
          <div className="flex flex-col gap-3">
            <Upload
              onUpload={({ uris }) => {
                if (!uris) return;
                setImgUri(uris[0]);
              }}
              initialUrls={memoInitialUpload}
              onUploadError={(error) => {
                // Keep the modal open so the inline error from <Upload> stays
                // visible. Previously this closed the modal, which (combined
                // with the dialog top-layer hiding toasts) made uploads fail
                // silently with no message.
                console.error("Upload failed:", error);
              }}
              label={DEFAULT_UPLOAD_PHRASE}
            />
            <p className="text-center text-xs opacity-40">
              Photos are public and count toward the global leaderboard
            </p>
            <div className="collapse collapse-arrow w-full rounded-2xl border-2 border-base-content bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium opacity-70">
                Advanced options
              </div>
              <div className="collapse-content">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs opacity-75">Caption</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    placeholder="Add a message to your dog"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="form-control mt-3">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs checkbox-primary"
                      checked={payOwnGas}
                      onChange={(e) => setPayOwnGas(e.target.checked)}
                    />
                    <span className="label-text text-xs opacity-75">Pay my own gas fees</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Cancel</button>
            </form>
            {!account?.isConnected ? (
              <ConnectButton client={client} />
            ) : payOwnGas ? (
              <TransactionButton
                className="pop-btn !btn !btn-primary font-display tracking-wide"
                transaction={getTx}
                onTransactionConfirmed={handleOnSuccess}
                disabled={!imgUri}
              >
                LOG IT
              </TransactionButton>
            ) : (
              <button
                className="pop-btn btn btn-primary font-display tracking-wide"
                onClick={logDog}
                disabled={isDisabled}
              >
                {isLoading && <span className="loading loading-spinner loading-sm" />}
                LOG IT
              </button>
            )}
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
        <div className="modal-box border-[3px] border-base-content bg-base-100">
          <h3 className="font-display text-2xl tracking-wide">Share the dog? 🌭</h3>
          <p className="py-3 text-sm opacity-70">Cast it on Farcaster and get the people talking.</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Skip</button>
            </form>
            <button className="pop-btn btn btn-primary font-display tracking-wide" onClick={shareOnFarcaster}>
              CAST IT
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
};
export const CreateAttestation = memo(CreateAttestationComponent);

import { type FC, useContext, useState, useMemo } from 'react';
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
import { keccak256, toBytes } from "viem";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { client as thirdwebClient } from "~/providers/Thirdweb";
import { getRpcClient, eth_getTransactionReceipt } from "thirdweb/rpc";
import type { ExecutionResult } from "thirdweb/engine";

const Upload = dynamic(() => import('~/components/utils/Upload'), { ssr: false });

const HOTDOG_LOGGED_TOPIC = keccak256(
  toBytes('HotdogLogged(uint256,address,address,string,string,uint256,address)')
);

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
  const [lastLoggedLogId, setLastLoggedLogId] = useState<string | undefined>();
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
  const [isTransactionIdResolved, setIsTransactionIdResolved] = useState<boolean>(false);

  const handleOnResolved = async (success: boolean, data?: unknown) => {
    if (success && account) {
      if (data && typeof data === "object" && (data as ExecutionResult).transactionHash) {
        try {
          const executionData = data as ExecutionResult;
          const chainId = executionData.chain.id;
          const txHash = executionData.transactionHash as `0x${string}`;
          const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
          if (chain) {
            const rpcRequest = getRpcClient({ client: thirdwebClient, chain });
            const receipt = await eth_getTransactionReceipt(rpcRequest, { hash: txHash });
            const log = receipt.logs.find(
              (l) => l.topics?.[0]?.toLowerCase() === HOTDOG_LOGGED_TOPIC.toLowerCase()
            );
            if (log) {
              const topic = log.topics?.[1];
              if (topic) {
                const logId = BigInt(topic).toString();
                setLastLoggedLogId(logId);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch logId", e);
        }
      }
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

      if (isMiniApp) {
        const dialog = document.getElementById('share_cast_modal') as HTMLDialogElement;
        dialog?.showModal();
      }
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
        const { transactionId } = await logHotdog({
          chainId: activeChain.id,
          imageUri: imgUri!,
          metadataUri: '',
          description,
        });
        setTransactionId(transactionId);

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
      await sdk.actions.composeCast({
        text: 'Just logged a dog on Log a Dog!',
        embeds: lastLoggedLogId ? [`https://logadog.xyz/dog/${lastLoggedLogId}`] : [],
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
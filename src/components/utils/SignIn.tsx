import { CheckIcon } from '@heroicons/react/24/outline';
import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import React, { type FC, useState, useEffect } from 'react';
import { SiweMessage } from 'siwe';
import { useActiveAccount } from 'thirdweb/react';
import { signMessage } from "thirdweb/utils";
import { DEFAULT_CHAIN } from '~/constants';

type Props = {
  btnLabel?: string;
  defaultOpen?: boolean;
}
const SignInWithEthereum: FC<Props> = ({ btnLabel, defaultOpen = false }) => {
  const { data: sessionData, status } = useSession();
  const account = useActiveAccount();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  useEffect(() => {
    const dialog = document.getElementById(
      `sign_in_modal`,
    ) as HTMLDialogElement | null;

    if (sessionData?.user) {
      dialog?.close();
    } else if (defaultOpen && status !== 'loading') {
      dialog?.showModal();
    }
  }, [defaultOpen, sessionData?.user, status]);
 
  const promptToSign = async () => {
    if (!account?.address) return;
    setIsSigningIn(true);
    
    try {
      const nonce = await getCsrfToken();

      const message = new SiweMessage({
        domain: document.location.host,
        address: account.address,
        chainId: DEFAULT_CHAIN.id,
        uri: document.location.origin,
        version: '1',
        statement: `Sign into Log a Dog`,
        nonce,
      }).prepareMessage();

      const signature = await signMessage({ message, account });

      const response = await signIn("ethereum", {
        message,
        signature,
        address: account.address,
        redirect: false,
      });


      if (response?.error) {
        throw new Error(response.error);
      }
    } catch (e) {
      console.error('Error signing in:', e);
    } finally {
      setIsSigningIn(false);
    }
  };
  if (sessionData?.user) return null;
  return (
    <>
    {/* Open the modal using document.getElementById('ID').showModal() method */}
    <button className="btn" onClick={()=>(document.getElementById(`sign_in_modal`) as HTMLDialogElement).showModal()}>
      {`${btnLabel ?? 'Vow to play with honor'}`}
    </button>
    <dialog id={`sign_in_modal`} className="modal">
      <div className="modal-box relative">
        <button 
          className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4"
          onClick={()=>(document.getElementById(`sign_in_modal`) as HTMLDialogElement).close()}
        >
          &times;
        </button>
        <h3 className="font-bold text-4xl text-center mb-4">🌭</h3>
        <h3 className="font-bold text-2xl text-center mb-4">Vow To Play With Honor</h3>
        <div className="flex items-center gap-1 text-center">
          <span>Log a dog is a game of integrity. Be honest. Play clean. Finish your dogs.</span>
        </div>
        <div className="modal-action">
          <button 
            onClick={promptToSign}
            className="btn mx-auto"
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <div className="loading loading-spinner" />
            ) : (
              <CheckIcon className="w-6 h-6" />
            )}
            I will play with honor
          </button>
        </div>
      </div>
    </dialog>
  </>

  );
}

export default SignInWithEthereum;
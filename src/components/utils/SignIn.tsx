import { CheckIcon } from '@heroicons/react/24/outline';
import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import React, { type FC, useState, useEffect } from 'react';
import { SiweMessage } from 'siwe';
import { useActiveAccount } from 'thirdweb/react';
import { signMessage } from "thirdweb/utils";
import useActiveChain from '~/hooks/useActiveChain';

type Props = {
  btnLabel?: string;
  defaultOpen?: boolean;
}
const SignInWithEthereum: FC<Props> = ({ btnLabel, defaultOpen = false }) => {
  const { data: sessionData, status } = useSession();
  const account = useActiveAccount();
  const { activeChain } = useActiveChain();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  console.log({ sessionData });

  useEffect(() => {
    if (defaultOpen && !sessionData?.user && status !== 'loading') {
      (document.getElementById(`sign_in_modal`) as HTMLDialogElement)?.showModal();
    }
  }, [defaultOpen, sessionData?.user, status]);

  // close the modal if the user is signed in
  useEffect(() => {
    if (sessionData?.user) {
      (document.getElementById(`sign_in_modal`) as HTMLDialogElement)?.close();
    }
  }, [sessionData?.user]);
 
  const promptToSign = async () => {
    console.log('promptToSign', account);
    if (!account?.address) return;
    setIsSigningIn(true);
    
    try {
      const nonce = await getCsrfToken();
      console.log('Got nonce:', nonce);

      const message = new SiweMessage({
        domain: document.location.host,
        address: account.address,
        chainId: activeChain?.id,
        uri: document.location.origin,
        version: '1',
        statement: `Sign into Log a Dog`,
        nonce,
      }).prepareMessage();

      const signature = await signMessage({ message, account });
      console.log('Got signature:', signature);

      const response = await signIn("ethereum", {
        message,
        signature,
        address: account.address,
        redirect: false,
      });

      console.log('Sign in response:', response);

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
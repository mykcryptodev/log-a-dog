import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import React, { type FC, useState } from 'react';
import { SiweMessage } from 'siwe';
import { useActiveAccount } from 'thirdweb/react';
import { signMessage } from "thirdweb/utils";
import useActiveChain from '~/hooks/useActiveChain';

type Props = {
  btnLabel?: string;
}
const SignInWithEthereum: FC<Props> = ({ btnLabel }) => {
  const { data: sessionData } = useSession();
  const account = useActiveAccount();
  const { activeChain } = useActiveChain();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  console.log({ sessionData });
 
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
    <button 
      onClick={promptToSign}
      className="btn"
      disabled={isSigningIn}
    >
      {isSigningIn && (
        <div className="loading loading-spinner" />
      )}
      {btnLabel ?? 'Sign In with Ethereum'}
    </button>
  );
}

export default SignInWithEthereum;
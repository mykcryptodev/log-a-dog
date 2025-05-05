import { createWalletClient, viemConnector } from '@farcaster/auth-client';
import { getCsrfToken } from 'next-auth/react';
import { env } from '~/env';

const walletClient = createWalletClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});

export const SignInWithFarcaster = () => {
  const handleSignIn = async () => {
    const { siweMessage, message } = walletClient.buildSignInMessage({
      address: '0x63C378DDC446DFf1d831B9B96F7d338FE6bd4231',
      fid: 1,
      uri: 'https://example.com/login',
      domain: 'example.com',
      nonce: 'ESsxs6MaFio7OvqWb',
    });
    const nonce = await getCsrfToken();
    const encodedNextAuthUrl = encodeURIComponent(`${env.NEXTAUTH_URL}`);
    const params = walletClient.parseSignInURI({
      uri: `farcaster://connect?channelToken=76be6229-bdf7-4ad2-930a-540fb2de1e08&nonce=${nonce}&siweUri=${encodedNextAuthUrl}&domain=${env.NEXTAUTH_URL}`,
    });
    console.log(params);
  }

  return (
    <button className="btn btn-primary" onClick={handleSignIn}>Sign in with Farcaster</button>
  )
};

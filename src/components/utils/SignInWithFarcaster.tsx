import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { env } from "~/env";

const appClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});

export const SignInWithFarcaster = () => {
  const { data: sessionData } = useSession();

  const handleSignIn = useCallback(async () => {
    try {
      const channel = await appClient.createChannel({
        siweUri: `${env.NEXT_PUBLIC_APP_URL}/login`,
        domain: env.NEXT_PUBLIC_APP_DOMAIN,
      });

      // Open the connect URI in a new window
      const connectUri = channel.data.url;
      const popup = window.open(connectUri, '_blank', 'width=600,height=700');
      if (!popup) {
        toast.error('Failed to open popup window. Please allow popups for this site.');
        return;
      }

      await appClient.watchStatus({
        channelToken: channel.data.channelToken,
        timeout: 60_000,
        interval: 1_000,
        onResponse: ({ response, data }) => {
          if (response.ok && data?.state === 'completed' && typeof data.fid === 'number' && data.signature && data.message) {
            // Verify the signature using the message from the response
            void appClient.verifySignInMessage({
              nonce: data.nonce,
              domain: env.NEXT_PUBLIC_APP_DOMAIN,
              message: data.message,
              signature: data.signature,
            }).then(async ({ success, error }) => {
              if (error) {
                console.error('Error verifying signature:', error);
              }
              if (success) {
                const result = await signIn('ethereum', {
                  message: data.message,
                  signature: data.signature,
                  address: data.custody,
                  redirect: false,
                });

                if (result?.error) {
                  toast.error(`Farcaster sign in error: ${result.error}`);
                }
              }
            }).finally(() => {
              popup?.close();
            });
          }
        },
      });
    } catch (error) {
      console.error('Error signing in with Farcaster:', error);
    }
  }, []);

  // Don't show the button if user is already signed in
  if (sessionData?.user) return null;

  return (
    <button className="btn min-w-fit" onClick={handleSignIn}>
      <Image src="/images/farcaster.svg" alt="Farcaster" width={20} height={20} />
    </button>
  );
};

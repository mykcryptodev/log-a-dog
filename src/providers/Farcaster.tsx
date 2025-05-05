import { AuthKitProvider } from '@farcaster/auth-kit';
import { optimism } from 'thirdweb/chains';
import { env } from '~/env';

const url = process.env.NODE_ENV === 'production' 
  ? 'https://logadog.xyz' 
  : 'http://localhost:3000';

const config = {
  rpcUrl: `https://${optimism.id}.rpc.thirdweb.com/${env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`,
  domain: url,
  siweUri: `${url}/login`,
};

export const FarcasterProvider = ({ children } : { 
  children: React.ReactNode
 }) => {
  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  )
};
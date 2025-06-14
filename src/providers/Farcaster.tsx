import { AuthKitProvider } from '@farcaster/auth-kit';
import { optimism } from 'thirdweb/chains';
import { env } from '~/env';

// Use environment variable or fallback to localhost for development
const url = env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

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
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ThirdwebProviderWithActiveChain } from "~/providers/Thirdweb";
import { Layout } from "~/components/utils/Layout";
import '@farcaster/auth-kit/styles.css';
import { FarcasterProvider } from "~/providers/Farcaster";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  // ThirdwebProvider can be configured with a chain when needed. For now we
  // always use the default chain and no longer track it via context.
  
  return (
    <SessionProvider session={session}>
      <ThirdwebProviderWithActiveChain>
        <FarcasterProvider>
          <Layout>
            <Component {...pageProps} />
            <div id="portal" />
          </Layout>
        </FarcasterProvider>
      </ThirdwebProviderWithActiveChain>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);

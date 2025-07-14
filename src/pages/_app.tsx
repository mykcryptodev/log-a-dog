import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ThirdwebProviderWithDefaultChain } from "~/providers/Thirdweb";
import { Layout } from "~/components/utils/Layout";
import '@farcaster/auth-kit/styles.css';
import { FarcasterProvider } from "~/providers/Farcaster";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <ThirdwebProviderWithDefaultChain>
        <FarcasterProvider>
          <Layout>
            <Component {...pageProps} />
            <div id="portal" />
          </Layout>
        </FarcasterProvider>
      </ThirdwebProviderWithDefaultChain>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);

import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { useContext, useEffect } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { useRouter } from "next/router";
import { ThirdwebProviderWithActiveChain } from "~/providers/Thirdweb";
import useActiveChain from "~/hooks/useActiveChain";
import { Layout } from "~/components/utils/Layout";
import '@farcaster/auth-kit/styles.css';
import { FarcasterProvider } from "~/providers/Farcaster";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const activeChainContext = useActiveChain();
  const { updateActiveChain } = useContext(ActiveChainContext);
  const router = useRouter();
  const { chain } = router.query as { chain: string };
  
  useEffect(() => {
    if (!chain) return;
    updateActiveChain(chain);
  }, [chain, updateActiveChain]);
  
  return (
    <SessionProvider session={session}>
      <ActiveChainContext.Provider value={activeChainContext}>
        <FarcasterProvider>
          <ThirdwebProviderWithActiveChain>
            <Layout>
              <Component {...pageProps} />
              <div id="portal" />
            </Layout>
          </ThirdwebProviderWithActiveChain>
        </FarcasterProvider>
      </ActiveChainContext.Provider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);

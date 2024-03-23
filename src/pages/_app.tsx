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
import 'react-toastify/dist/ReactToastify.css';
import { WalletProvider } from "@coinbase/waas-sdk-web-react";

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
        <WalletProvider
          collectAndReportMetrics
          enableHostedBackups
          projectId={"9418738b-c109-4db5-9ac0-3333e0aabbe9"}
          prod={false}
        >
          <ThirdwebProviderWithActiveChain>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ThirdwebProviderWithActiveChain>
        </WalletProvider>
      </ActiveChainContext.Provider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);

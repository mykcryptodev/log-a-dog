import "~/styles/globals.css";

import { 
  magicLink,
  ThirdwebProvider,
} from "@thirdweb-dev/react";
import { type AppType } from "next/app";
import { useRouter } from "next/router";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useContext, useEffect } from "react";

import { Layout } from "~/components/utils/Layout";
import { APP_NAME } from "~/constants";
import { SUPPORTED_CHAINS } from "~/constants/chain";
import ActiveChainContext from "~/context/ActiveChain";
import useActiveChain from "~/hooks/useActiveChain";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const activeChainContext = useActiveChain();

  function ThirdwebProviderWithActiveChain({ children } : { 
    children: React.ReactNode 
  }) {
    const { activeChain, updateActiveChain } = useContext(ActiveChainContext);
    const router = useRouter();
    const { chain } = router.query as { chain: string };
    const isDarkMode = useIsDarkTheme();
    
    useEffect(() => {
      if (!chain) return;
      updateActiveChain(chain);
    }, [chain, updateActiveChain]);
  
    return (
      <ThirdwebProvider
        activeChain={activeChain}
        supportedChains={SUPPORTED_CHAINS}
        supportedWallets={[
          magicLink({
            apiKey: process.env.NEXT_PUBLIC_MAGIC_LINK_API_KEY || "",
          }),
        ]}
        authConfig={{
          domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "",
          authUrl: "/api/auth",
        }}
        dAppMeta={{
          name: APP_NAME,
          description: "A marketplace for NFTs",
          isDarkMode,
          url: process.env.NEXT_PUBLIC_SITE_URL || "",
          logoUrl: "/logo.png",
        }}
      >
        {children}
      </ThirdwebProvider>
    )
  }
  
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <ActiveChainContext.Provider value={activeChainContext}>
          <ThirdwebProviderWithActiveChain>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ThirdwebProviderWithActiveChain>
        </ActiveChainContext.Provider>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);

import { useContext, useMemo } from "react";
import { ThirdwebProvider, embeddedWalletConfig, smartWalletConfig, metamaskConfig, coinbaseConfig, walletConnectConfig, type EmbeddedWalletAuth } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { createThirdwebClient } from "thirdweb";
import { env } from "~/env";

export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const ThirdwebProviderWithActiveChain = ({ children } : { 
  children: React.ReactNode
 }) => {
  const { activeChain } = useContext(ActiveChainContext);

  const smartWalletOptions = useMemo(() => ({
    chain: activeChain,
    factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
    clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    gasless: true,
  }), [activeChain]);

  const isProduction = !activeChain.testnet;
  const productionOnlySocials = ["facebook", "apple", "google"] as EmbeddedWalletAuth[];
  const devEmbeddedWallets = ["email"] as EmbeddedWalletAuth[];
  const allEmbeddedWallets = devEmbeddedWallets.concat(productionOnlySocials);

  return (
    <ThirdwebProvider 
      client={client}
      dappMetadata={{
        name: "Onchain Hotdogs",
        url: "https://my-website.com",
        description: "Who can eat the most hotdogs onchain?",
        logoUrl: "/logo.png",
      }}
      wallets={[
        smartWalletConfig(embeddedWalletConfig({
          auth: {
            options: isProduction ? allEmbeddedWallets : devEmbeddedWallets,
          }
        }), smartWalletOptions),
        metamaskConfig(),
        coinbaseConfig(),
        walletConnectConfig(),
      ]}
    >
      {children}
    </ThirdwebProvider>
  )
};
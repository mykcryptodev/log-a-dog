import { useContext } from "react";
import { createThirdwebClient } from "thirdweb";
import { COINBASE_WAAS_PROJECT_ID } from "~/constants";
import ActiveChainContext from "~/contexts/ActiveChain";
import { env } from "~/env";
import { WalletProvider } from "@coinbase/waas-sdk-web-react";

export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const CoinbaseProvider = ({ children } : { 
  children: React.ReactNode
 }) => {
  const { activeChain } = useContext(ActiveChainContext);

  return (
    <WalletProvider
      collectAndReportMetrics
      enableHostedBackups // DO NOT CHANGE THIS TO FALSE
      projectId={COINBASE_WAAS_PROJECT_ID[activeChain.id]}
      prod={process.env.NODE_ENV === "production"}
    >
      {children}
    </WalletProvider>
  )
};
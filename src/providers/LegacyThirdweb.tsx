import { ThirdwebProvider } from "@thirdweb-dev/react";
import { useContext } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { env } from "~/env";
import { LEGACY_SUPPORTED_CHAINS } from "../constants/chains";

export const LegacyThirdwebProviderWithActiveChain = ({ children } : { 
  children: React.ReactNode
 }) => {
  const { activeChain } = useContext(ActiveChainContext);

  return (
    <ThirdwebProvider
      activeChain={activeChain.id}
      clientId={env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      supportedChains={LEGACY_SUPPORTED_CHAINS}
    >
      {children}
    </ThirdwebProvider>
  )
}
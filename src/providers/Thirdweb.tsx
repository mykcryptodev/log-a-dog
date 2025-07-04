import { useContext } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { env } from "~/env";
import ActiveChainContext from "~/contexts/ActiveChain";

export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const ThirdwebProviderWithActiveChain = ({ children }: { children: React.ReactNode }) => {
  const { activeChain } = useContext(ActiveChainContext);
  return (
    <ThirdwebProvider clientId={env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID} activeChain={activeChain}>
      {children}
    </ThirdwebProvider>
  );
};
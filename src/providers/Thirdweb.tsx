import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { env } from "~/env";
import { DEFAULT_CHAIN } from "~/constants";

export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const ThirdwebProviderWithDefaultChain = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThirdwebProvider client={client} activeChain={DEFAULT_CHAIN}>
      {children}
    </ThirdwebProvider>
  );
};
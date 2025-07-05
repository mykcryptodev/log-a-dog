import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { env } from "~/env";

export const client = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const ThirdwebProviderWithActiveChain = ({ children }: { children: React.ReactNode }) => {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
};
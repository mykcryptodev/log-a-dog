import { type FC } from "react";
import { baseSepolia } from "thirdweb/chains";
import { ConnectButton, smartWalletConfig } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { coinbaseWaasConfig } from "~/wallet/CoinbaseWaasConfig";
import { env } from "~/env";

type Props = {
  loginBtnLabel?: string;
}
export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const smartWalletOptions = {
    chain: baseSepolia,
    factoryAddress: SMART_WALLET_FACTORY[baseSepolia.id]!,
    clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    gasless: true,
  }
  
  return (
    <ConnectButton 
      connectButton={{
        label: loginBtnLabel ?? "Login"
      }}
      connectModal={{
        title: "Login to Log a Dog",
        showThirdwebBranding: false,
        titleIcon: "https://logadog.xyz/images/logo.png",
      }} 
      client={client} 
      appMetadata={{
        name: "Log a Dog",
        url: "https://logadog.xyz",
        description: "Who can eat the most hotdogs onchain?",
        logoUrl: "https://logadog.xyz/images/logo.png"
      }}
      wallets={[
        smartWalletConfig(
          coinbaseWaasConfig(), smartWalletOptions
        ),
      ]}
      chain={baseSepolia}
    />
  );
};

export default Connect;
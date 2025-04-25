import { type FC, useContext, useState, useEffect } from "react";
import { ConnectButton } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { createWallet, inAppWallet, walletConnect } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";

type Props = {
  loginBtnLabel?: string;
}

export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  
  useEffect(() => {
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const cryptoWallets = [
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    walletConnect(),
  ];

  const inAppWallets = [
    inAppWallet({
      auth: {
        options: ['email', 'phone', 'x', 'google']
      }
    })
  ];

  return (
    <ConnectButton
      client={client}
      chain={activeChain}
      theme={userPrefersDarkMode ? "dark" : "light"}
      connectButton={{
        label: loginBtnLabel ?? "Login",
        className: "btn",
      }}
      connectModal={{
        title: "Login to Log a Dog",
        titleIcon: "/images/logo.png",
        welcomeScreen: {
          title: "Login to Log a Dog",
          img: {
            src: "/images/logo.png",
          }
        },
        showThirdwebBranding: false,
      }}
      recommendedWallets={[createWallet("com.coinbase.wallet")]}
      wallets={[
        ...cryptoWallets,
        ...inAppWallets.map(wallet => ({
          ...wallet,
          accountAbstraction: {
            chain: activeChain,
            factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
            gasless: true,
          }
        }))
      ]}
      showAllWallets={true}
    />
  );
};

export default Connect;
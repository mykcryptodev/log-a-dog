import { type FC, useContext, useState, useEffect } from "react";
import { ConnectButton } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { createWallet, inAppWallet, walletConnect } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";
import { useSession, signIn, getCsrfToken, signOut } from "next-auth/react";
import { env } from "~/env";

type Props = {
  loginBtnLabel?: string;
}

export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const { data: sessionData } = useSession();
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

  const message = `Sign into Log a Dog`;
  const createPayload = async ({ address }: { address: string }) => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Failed to get CSRF token");
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      nonce,
      domain: env.NEXT_PUBLIC_APP_DOMAIN,
      message,
      address,
      statement: message,
      version: "1",
      issued_at: now.toISOString(),
      expiration_time: oneHourFromNow.toISOString(),
      invalid_before: now.toISOString()
    }
  }

  return (
    <ConnectButton
      client={client}
      chain={activeChain}
      theme={userPrefersDarkMode ? "dark" : "light"}
      auth={{
        isLoggedIn: async () => {
          if (sessionData?.user?.id) {
            return true;
          }
          return false;
        },
        doLogin: async (params) => {
          await signIn('ethereum', {
            message,
            signature: params.signature,
            address: params.payload.address,
          });
        },
        getLoginPayload: async ({ address }) =>
          createPayload({ address }),
        doLogout: async () => {
          console.log("logging out!");
          await signOut();
        },
      }}
      connectButton={{
        label: loginBtnLabel ?? "Login",
        className: "!btn",
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
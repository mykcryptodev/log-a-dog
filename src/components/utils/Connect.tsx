import { type FC, useContext, useState, useEffect, useCallback } from "react";
import { ConnectButton } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { createWallet, inAppWallet, type Wallet, walletConnect } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";
import { useSession, signIn, getCsrfToken, signOut } from "next-auth/react";
import { env } from "~/env";
import { signMessage } from "thirdweb/utils";

type Props = {
  loginBtnLabel?: string;
}

export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const { data: sessionData, status } = useSession();
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
  const createPayload = useCallback(async ({ address }: { address: string }) => {
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
  }, [message]);

  const silentlySignIn = useCallback(async (wallet: Wallet) => {
    console.log('silentlySignIn', wallet, sessionData?.user?.id);
    if (sessionData?.user?.id ?? status === 'loading') {
      console.log('signed in or is signing in...')
      return;
    }
    if (wallet.id !== 'inApp') {
      console.log('not an inApp wallet')
      return;
    }
    try {
      const walletAddress = wallet.getAccount()!.address;
      const payload = await createPayload({ address: walletAddress });
      const signature = await signMessage({
        message,
        account: wallet.getAccount()!,
      });
      await signIn('ethereum', {
        message,
        signature,
        address: payload.address,
        redirect: false,
      });
    } catch (error) {
      console.error("Error signing in with wallet:", error);
    }
  }, [createPayload, message, sessionData?.user?.id, status]);

  return (
    <ConnectButton
      client={client}
      chain={activeChain}
      theme={userPrefersDarkMode ? "dark" : "light"}
      onConnect={(wallet) => silentlySignIn(wallet)}
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
import { type FC, useEffect, useCallback, useRef } from "react";
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import {
  createWallet,
  inAppWallet,
  type Wallet,
  walletConnect,
} from "thirdweb/wallets";
import { useSession, signIn, getCsrfToken, signOut } from "next-auth/react";
import { env } from "~/env";
import { signMessage } from "thirdweb/utils";
import { createLoginMessage } from "~/helpers/createLoginMessage";
import { DEFAULT_CHAIN } from "~/constants";
import usePrefersDarkMode from "~/hooks/usePrefersDarkMode";
import useMounted from "~/hooks/useMounted";

type Props = {
  loginBtnLabel?: string;
  className?: string;
};

export const Connect: FC<Props> = ({ loginBtnLabel, className }) => {
  const { data: sessionData, status } = useSession();
  const mounted = useMounted();
  const userPrefersDarkMode = usePrefersDarkMode();
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const sessionDataRef = useRef<typeof sessionData>(null);
  const statusRef = useRef<typeof status>("loading");
  const signInInFlightRef = useRef(false);

  // Update refs when session data changes
  useEffect(() => {
    sessionDataRef.current = sessionData;
    statusRef.current = status;
  }, [sessionData, status]);

  const hasMatchingSession = useCallback(() => {
    const sessionAddress = sessionDataRef.current?.user?.address?.toLowerCase();
    const accountAddress = account?.address?.toLowerCase();
    return Boolean(
      sessionDataRef.current?.user?.id &&
        sessionAddress &&
        accountAddress &&
        sessionAddress === accountAddress,
    );
  }, [account?.address]);

  const cryptoWallets = [
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    walletConnect(),
  ];

  const inAppWallets = [
    inAppWallet({
      auth: {
        options: ["email", "phone", "x", "google"],
      },
    }),
  ];

  const message = `Sign into Log a Dog`;
  const createPayload = useCallback(
    async ({ address }: { address: string }) => {
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
        invalid_before: now.toISOString(),
      };
    },
    [message],
  );

  const silentlySignIn = useCallback(
    async (wallet: Wallet) => {
      // Check session state using refs to avoid dependency issues
      if (
        (sessionDataRef.current?.user?.id ?? false) ||
        statusRef.current === "loading" ||
        signInInFlightRef.current
      ) {
        return;
      }

      // Check if there's already a session for this wallet address
      if (sessionDataRef.current?.user?.address && wallet.getAccount()) {
        const walletAddress = wallet.getAccount()!.address.toLowerCase();
        const sessionAddress =
          sessionDataRef.current.user.address.toLowerCase();
        if (walletAddress === sessionAddress) {
          return;
        }
      }

      // Auto-sign-in for inApp wallets and injected EIP-1193 wallets (e.g. Farcaster mini app).
      // Skip for external wallets that require explicit user action (MetaMask, Coinbase, etc.).
      const skipIds = ["io.metamask", "com.coinbase.wallet", "me.rainbow", "walletConnect"];
      if (skipIds.some(id => wallet.id.startsWith(id))) {
        return;
      }
      signInInFlightRef.current = true;
      try {
        const walletAddress = wallet.getAccount()!.address;
        const payload = await createPayload({ address: walletAddress });
        const signature = await signMessage({
          message,
          account: wallet.getAccount()!,
        });
        await signIn("ethereum", {
          message,
          signature,
          address: payload.address,
          redirect: false,
        });
      } catch (error) {
        console.error("Error signing in with wallet:", error);
      } finally {
        signInInFlightRef.current = false;
      }
    },
    [createPayload, message],
  ); // Stable dependencies only

  // Auto-sign-in via next-auth when a wallet is already connected but no
  // next-auth session exists yet (e.g. Farcaster mini-app auto-connect).
  useEffect(() => {
    if (!account || !activeWallet || status === "loading" || hasMatchingSession()) {
      return;
    }
    void silentlySignIn(activeWallet);
  }, [account, activeWallet, sessionData?.user?.id, sessionData?.user?.address, status, silentlySignIn, hasMatchingSession]);

  // Prevent hydration mismatch by not rendering ConnectButton until mounted
  if (!mounted) {
    return (
      <button className={className ?? "btn min-w-fit"} disabled>
        {loginBtnLabel ?? "Login"}
      </button>
    );
  }

  return (
    <ConnectButton
      client={client}
      chain={DEFAULT_CHAIN}
      theme={userPrefersDarkMode ? "dark" : "light"}
      autoConnect={false}
      connectButton={{
        label: loginBtnLabel ?? "Login",
        className: className ?? "!btn !min-w-fit",
      }}
      onConnect={(wallet) => {
        void silentlySignIn(wallet);
      }}
      auth={{
        isLoggedIn: async () => {
          // Only consider logged in if there's both a session AND a wallet connected
          // This prevents state mismatches that cause infinite refreshes
          if (sessionData?.user?.id && account?.address) {
            return true;
          }
          return false;
        },
        doLogin: async (params) => {
          // Build the exact EIP-4361 string that the wallet signed so
          // verifySignature on the server can verify it correctly.
          const loginMessage = createLoginMessage(params.payload);
          await signIn("ethereum", {
            message: loginMessage,
            signature: params.signature,
            address: params.payload.address,
            redirect: false,
          });
        },
        getLoginPayload: async ({ address }) => createPayload({ address }),
        doLogout: async () => {
          // Avoid redirect loops by disabling the default signOut redirect
          await signOut({ redirect: false });
        },
      }}
      connectModal={{
        title: "Login to Log a Dog",
        titleIcon: "/images/logo.png",
        welcomeScreen: {
          title: "Login to Log a Dog",
          img: {
            src: "/images/logo.png",
          },
        },
        showThirdwebBranding: false,
      }}
      recommendedWallets={[createWallet("com.coinbase.wallet")]}
      wallets={[
        ...cryptoWallets,
        ...inAppWallets.map((wallet) => ({
          ...wallet,
          accountAbstraction: {
            chain: DEFAULT_CHAIN,
            gasless: true,
          },
        })),
      ]}
      showAllWallets={true}
    />
  );
};

export default Connect;

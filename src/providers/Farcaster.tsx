import {
  type ComponentType,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { optimism } from "thirdweb/chains";
import { EIP1193 } from "thirdweb/wallets";
import { env } from "~/env";
import { client } from "~/providers/Thirdweb";
import type {
  Context,
  FrameNotificationDetails,
} from "@farcaster/frame-sdk";
import { useConnect } from "thirdweb/react";
import { type Wallet } from "thirdweb/wallets";
import { signMessage } from "thirdweb/utils";
import { signIn, getCsrfToken, useSession } from "next-auth/react";
import { DEFAULT_CHAIN } from "~/constants";
import { toast } from "react-toastify";
import { getFarcasterSdk } from "~/utils/farcasterSdk";

type AddMiniAppResult = {
  notificationDetails?: FrameNotificationDetails;
};

// Use environment variable or fallback to localhost for development
const url = env.NEXT_PUBLIC_APP_DOMAIN || "http://localhost:3000";

const config = {
  rpcUrl: `https://${optimism.id}.rpc.thirdweb.com/${env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`,
  domain: url,
  siweUri: `${url}/login`,
};

type AuthKitProviderProps = {
  config: typeof config;
  children: React.ReactNode;
};

type FarcasterContextType = {
  context: Context.FrameContext | undefined;
  isMiniApp: boolean;
  viewProfile: (fid: number) => Promise<void>;
  swapToken: (token: string, sellAmount?: string) => Promise<void>;
  addMiniApp: () => Promise<AddMiniAppResult | undefined>;
};

export const FarcasterContext = createContext<FarcasterContextType | null>(
  null,
);

export const FarcasterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [AuthKitProvider, setAuthKitProvider] =
    useState<ComponentType<AuthKitProviderProps> | null>(null);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [hasConnectedWallet, setHasConnectedWallet] = useState(false);
  const { connect } = useConnect();
  const { data: sessionData } = useSession();

  const connectWallet = useCallback(async () => {
    try {
      const sdk = await getFarcasterSdk();
      let connectedWallet: Wallet | null = null;
      await connect(async () => {
        // create a wallet instance from the Warpcast provider
        const wallet = EIP1193.fromProvider({
          provider: sdk.wallet.ethProvider,
        });

        // trigger the connection
        await wallet.connect({ client, chain: DEFAULT_CHAIN });
        connectedWallet = wallet;

        // return the wallet to the app context
        return wallet;
      });

      // Establish a next-auth session immediately after wallet connects.
      // ConnectButton's onConnect fires only for UI-driven connects — this
      // auto-connect bypasses it, so we do the SIWE flow here instead.
      if (connectedWallet && !sessionData?.user?.id) {
        const account = (connectedWallet as Wallet).getAccount();
        if (account) {
          const nonce = await getCsrfToken();
          if (nonce) {
            const message = "Sign into Log a Dog";
            const signature = await signMessage({ message, account });
            await signIn("ethereum", {
              message,
              signature,
              address: account.address,
              redirect: false,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to connect wallet", err);
    }
  }, [connect, sessionData?.user?.id]);

  const viewProfile = useCallback(async (fid: number) => {
    try {
      const sdk = await getFarcasterSdk();
      await sdk.actions.viewProfile({ fid });
    } catch (err) {
      console.error("Failed to open Farcaster profile", err);
      toast.error("Failed to open Farcaster profile");
    }
  }, []);

  const swapToken = useCallback(async (token: string, sellAmount?: string) => {
    try {
      const sdk = await getFarcasterSdk();
      const CAIP19 = `eip155:${DEFAULT_CHAIN.id}/erc20:${token}`;
      await sdk.actions.swapToken({ buyToken: CAIP19, sellAmount });
    } catch (err) {
      console.error("Failed to swap token", err);
      toast.error("Failed to open token swap");
    }
  }, []);

  const addMiniApp = useCallback(async () => {
    try {
      const sdk = await getFarcasterSdk();
      return await sdk.actions.addMiniApp();
    } catch (err) {
      console.error("Failed to add mini app", err);
      toast.error("Failed to add mini app");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ AuthKitProvider: LoadedAuthKitProvider }, sdk] =
          await Promise.all([
            import("@farcaster/auth-kit"),
            getFarcasterSdk(),
          ]);
        setAuthKitProvider(() => LoadedAuthKitProvider);

        const frameContext = await sdk.context;
        setContext(frameContext);
        const mini = await sdk.isInMiniApp();
        setIsMiniApp(mini);
        await sdk.actions.ready({});
        if (mini && sdk.wallet && !hasConnectedWallet) {
          await connectWallet();
          setHasConnectedWallet(true);
        }
      } catch (err) {
        console.error("Failed to load SDK", err);
      }
    };
    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      void load();
    }
  }, [isSDKLoaded, connectWallet, hasConnectedWallet]);

  const value = useMemo(
    () => ({
      context,
      isMiniApp,
      viewProfile,
      swapToken,
      addMiniApp,
    }),
    [context, isMiniApp, viewProfile, swapToken, addMiniApp],
  );

  return (
    <FarcasterContext.Provider value={value}>
      {AuthKitProvider ? (
        <AuthKitProvider config={config}>{children}</AuthKitProvider>
      ) : (
        children
      )}
    </FarcasterContext.Provider>
  );
};

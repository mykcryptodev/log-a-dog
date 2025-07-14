import { AuthKitProvider } from "@farcaster/auth-kit";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { optimism } from "thirdweb/chains";
import { EIP1193 } from "thirdweb/wallets";
import { env } from "~/env";
import { client } from "~/providers/Thirdweb";
import {
  type FrameNotificationDetails,
  sdk,
  type Context,
} from "@farcaster/frame-sdk";
import { useConnect } from "thirdweb/react";
import { DEFAULT_CHAIN } from "~/constants";
import { toast } from "react-toastify";

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
  const activeChain = DEFAULT_CHAIN;
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [hasConnectedWallet, setHasConnectedWallet] = useState(false);
  const attemptedConnectionRef = useRef(false);
  const { connect } = useConnect();

  const connectWallet = useCallback(async () => {
    try {
      await connect(async () => {
        // create a wallet instance from the Warpcast provider
        const wallet = EIP1193.fromProvider({
          provider: sdk.wallet.ethProvider,
        });

        // trigger the connection
        await wallet.connect({ client, chain: activeChain });

        // return the wallet to the app context
        return wallet;
      });
    } catch (err) {
      console.error("Failed to connect wallet", err);
    }
  }, [connect, activeChain]);

  const viewProfile = useCallback(async (fid: number) => {
    try {
      await sdk.actions.viewProfile({ fid });
    } catch (err) {
      console.error("Failed to open Farcaster profile", err);
      toast.error("Failed to open Farcaster profile");
    }
  }, []);

  const swapToken = useCallback(async (token: string, sellAmount?: string) => {
    try {
      const CAIP19 = `eip155:${DEFAULT_CHAIN.id}/erc20:${token}`;
      await sdk.actions.swapToken({ buyToken: CAIP19, sellAmount });
    } catch (err) {
      console.error("Failed to swap token", err);
      toast.error("Failed to open token swap");
    }
  }, []);

  const addMiniApp = useCallback(async () => {
    try {
      return await sdk.actions.addMiniApp();
    } catch (err) {
      console.error("Failed to add mini app", err);
      toast.error("Failed to add mini app");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const frameContext = await sdk.context;
        setContext(frameContext);
        const mini = await sdk.isInMiniApp();
        setIsMiniApp(mini);
        await sdk.actions.ready({});
      } catch (err) {
        console.error("Failed to load SDK", err);
      }
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      void load();
    }
  }, [isSDKLoaded]);

  // Separate effect for wallet connection after context is loaded
  useEffect(() => {
    if (
      context &&
      sdk.wallet &&
      isSDKLoaded &&
      !hasConnectedWallet &&
      !attemptedConnectionRef.current
    ) {
      attemptedConnectionRef.current = true;
      void connectWallet()
        .catch((err) => {
          console.error("Failed to connect wallet", err);
        })
        .finally(() => setHasConnectedWallet(true));
    }
  }, [context, isSDKLoaded, connectWallet, hasConnectedWallet]);

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
      <AuthKitProvider config={config}>{children}</AuthKitProvider>
    </FarcasterContext.Provider>
  );
};

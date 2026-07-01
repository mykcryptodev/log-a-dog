import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import type { Wallet } from "thirdweb/wallets";
import { inAppWallet, walletConnect } from "thirdweb/wallets";
import { getThirdwebClient, getThirdwebChain } from "~/utils/thirdweb";
import { useAuth } from "~/providers/AuthProvider";

interface WalletContextValue {
  wallet: Wallet | null;
  address: string | null;
  isConnecting: boolean;
  hasSigner: boolean;
  connectInAppWallet: () => Promise<boolean>;
  connectExternalWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  wallet: null,
  address: null,
  isConnecting: false,
  hasSigner: false,
  connectInAppWallet: async () => false,
  connectExternalWallet: async () => false,
  disconnectWallet: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectInAppWallet = useCallback(async () => {
    const client = getThirdwebClient();
    const chain = getThirdwebChain();
    const w = inAppWallet();
    setIsConnecting(true);
    try {
      const connected = await w.autoConnect({ client, chain });
      if (connected) {
        setWallet(w);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const connectExternalWallet = useCallback(async () => {
    const client = getThirdwebClient();
    const chain = getThirdwebChain();
    const w = walletConnect();
    setIsConnecting(true);
    try {
      await w.connect({
        client,
        chain,
      });
      setWallet(w);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not connect wallet";
      Alert.alert("Wallet Connect", msg);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await wallet?.disconnect();
    } catch {
      // ignore
    }
    setWallet(null);
  }, [wallet]);

  // Auto-reconnect in-app wallet on launch (email/Google users).
  useEffect(() => {
    void connectInAppWallet();
  }, [connectInAppWallet]);

  const address = wallet?.getAccount()?.address?.toLowerCase() ?? session?.address ?? null;
  const hasSigner = !!wallet?.getAccount();

  const value = useMemo(
    () => ({
      wallet,
      address,
      isConnecting,
      hasSigner,
      connectInAppWallet,
      connectExternalWallet,
      disconnectWallet,
    }),
    [
      wallet,
      address,
      isConnecting,
      hasSigner,
      connectInAppWallet,
      connectExternalWallet,
      disconnectWallet,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

/** Mirrors web useActiveWallet / useActiveAccount for on-chain components. */
export function useActiveWallet() {
  return useWallet().wallet;
}

export function useActiveAccount() {
  const { wallet } = useWallet();
  const { session } = useAuth();
  return (
    wallet?.getAccount() ??
    (session?.address ? { address: session.address as `0x${string}` } : undefined)
  );
}

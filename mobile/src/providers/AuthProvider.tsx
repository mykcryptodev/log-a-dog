import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Linking } from "react-native";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import { inAppWallet, type Account } from "thirdweb/wallets";
import {
  API_URL,
  CHAIN_ID,
  FARCASTER_DOMAIN,
  FARCASTER_RELAY_URL,
  FARCASTER_SIWE_URI,
} from "~/constants";
import { getThirdwebChain, getThirdwebClient } from "~/utils/thirdweb";
import { clearSession, loadSession, saveSession } from "~/utils/storage";
import type { Session } from "~/types";

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signInWithFarcaster: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ requiresVerification: true; verify: (code: string) => Promise<void> } | void>;
  signInWithGoogle: () => Promise<void>;
  signInWithWallet: (account: Account) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  signInWithFarcaster: async () => {},
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signInWithWallet: async () => {},
  signOut: async () => {},
});

async function createSiweMessage(address: string): Promise<string> {
  const nonce = Math.random().toString(36).slice(2);
  const issuedAt = new Date().toISOString();
  return [
    `${FARCASTER_DOMAIN} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to Log a Dog",
    "",
    `URI: ${FARCASTER_SIWE_URI}`,
    "Version: 1",
    `Chain ID: ${CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

async function postToNextAuth(
  address: string,
  message: string,
  signature: string,
): Promise<string> {
  const csrfRes = await fetch(`${API_URL}/api/auth/csrf`);
  if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const signInRes = await fetch(`${API_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      address,
      signature,
      message,
      json: "true",
    }).toString(),
    redirect: "manual",
  });

  const rawCookies = signInRes.headers.get("set-cookie") ?? "";
  const sessionTokenMatch = rawCookies.match(/next-auth\.session-token=([^;]+)/);
  const sessionToken = sessionTokenMatch?.[1];

  if (!sessionToken) {
    throw new Error(
      "Authentication failed — could not retrieve session token. Ensure your signature is valid.",
    );
  }
  return sessionToken;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then((stored) => {
        if (stored) setSession(JSON.parse(stored) as Session);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const persistSession = useCallback(async (s: Session) => {
    await saveSession(JSON.stringify(s));
    setSession(s);
  }, []);

  const signInWithAccount = useCallback(
    async (account: Account, profile?: Pick<Session, "fid" | "username" | "image" | "name">) => {
      const message = await createSiweMessage(account.address);
      const signature = await account.signMessage({ message });
      const sessionToken = await postToNextAuth(account.address, message, signature);

      await persistSession({
        address: account.address.toLowerCase(),
        sessionToken,
        fid: profile?.fid ?? null,
        username: profile?.username ?? null,
        image: profile?.image ?? null,
        name: profile?.name ?? null,
      });
    },
    [persistSession],
  );

  const signInWithFarcaster = useCallback(async () => {
    const appClient = createAppClient({
      relay: FARCASTER_RELAY_URL,
      ethereum: viemConnector(),
    });

    const { data: channelData, isError } = await appClient.createChannel({
      siweUri: FARCASTER_SIWE_URI,
      domain: FARCASTER_DOMAIN,
    });

    if (isError || !channelData) throw new Error("Failed to create Farcaster auth channel");

    const { url, channelToken } = channelData;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Open Warpcast", `Paste this URL in Warpcast:\n\n${url}`);
    }

    const { data: statusData, isError: statusErr } = await appClient.watchStatus({
      channelToken,
      timeout: 300_000,
      interval: 1_500,
    });

    if (statusErr || !statusData) throw new Error("Sign-in timed out or was cancelled");

    const { custody, signature, message, fid, username, displayName, pfpUrl } =
      statusData as {
        custody: string;
        signature: string;
        message: string;
        fid?: number;
        username?: string;
        displayName?: string;
        pfpUrl?: string;
      };

    const sessionToken = await postToNextAuth(custody, message, signature);

    await persistSession({
      address: custody.toLowerCase(),
      sessionToken,
      fid: fid ?? null,
      username: username ?? null,
      image: pfpUrl ?? null,
      name: displayName ?? username ?? null,
    });
  }, [persistSession]);

  const signInWithEmail = useCallback(
    async (email: string) => {
      const { preAuthenticate } = await import("thirdweb/wallets/in-app");
      const thirdwebClient = getThirdwebClient();

      await preAuthenticate({
        client: thirdwebClient,
        strategy: "email",
        email,
      });

      return {
        requiresVerification: true as const,
        verify: async (verificationCode: string) => {
          const wallet = inAppWallet();
          const thirdwebClient = getThirdwebClient();
          const account = await wallet.connect({
            client: thirdwebClient,
            // @ts-ignore - chain type compatibility
            chain: getThirdwebChain(),
            strategy: "email",
            email,
            verificationCode,
          });

          await signInWithAccount(account, { name: email });
        },
      };
    },
    [signInWithAccount],
  );

  const signInWithGoogle = useCallback(async () => {
    const wallet = inAppWallet();
    const thirdwebClient = getThirdwebClient();
    const account = await wallet.connect({
      client: thirdwebClient,
      // @ts-ignore - chain type compatibility
      chain: getThirdwebChain(),
      strategy: "google",
      redirectUrl: "logadog://",
    });

    await signInWithAccount(account);
  }, [signInWithAccount]);

  const signInWithWallet = useCallback(
    async (account: Account) => {
      await signInWithAccount(account);
    },
    [signInWithAccount],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, signInWithFarcaster, signInWithEmail, signInWithGoogle, signInWithWallet, signOut }),
    [session, isLoading, signInWithFarcaster, signInWithEmail, signInWithGoogle, signInWithWallet, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

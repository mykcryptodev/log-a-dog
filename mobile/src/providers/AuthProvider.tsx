import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, Linking } from "react-native";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import { inAppWallet, type Account } from "thirdweb/wallets";
import {
  API_URL,
  APP_DOMAIN,
  APP_URL,
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

type AuthProfile = Pick<Session, "fid" | "username" | "image" | "name">;

async function createSiweMessage(address: string): Promise<string> {
  const nonce = Math.random().toString(36).slice(2);
  const issuedAt = new Date().toISOString();
  return [
    `${APP_DOMAIN} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to Log a Dog",
    "",
    `URI: ${APP_URL}/login`,
    "Version: 1",
    `Chain ID: ${CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

async function postToMobileAuth(
  address: string,
  message: string,
  signature: string,
  profile?: AuthProfile,
): Promise<{ sessionToken: string; user: AuthProfile & { address: string } }> {
  const signInRes = await fetch(`${API_URL}/api/mobile/auth/siwe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      signature,
      message,
      profile,
    }),
  });

  const payload = (await signInRes.json().catch(() => null)) as
    | {
        sessionToken?: string;
        user?: AuthProfile & { address: string };
        error?: string;
      }
    | null;

  if (!signInRes.ok || !payload?.sessionToken || !payload.user) {
    throw new Error(
      payload?.error ?? "Authentication failed — could not retrieve session token. Ensure your signature is valid.",
    );
  }
  return { sessionToken: payload.sessionToken, user: payload.user };
}

/**
 * Resolves once this app is in the foreground. Right after a WalletConnect
 * pairing is approved the user is still inside their wallet app; firing the
 * SIWE sign request while we're backgrounded means the OS blocks the deep
 * link back into the wallet and the signature prompt never appears.
 */
async function waitForAppForeground(): Promise<void> {
  if (AppState.currentState !== "active") {
    await new Promise<void>((resolve) => {
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          sub.remove();
          resolve();
        }
      });
    });
    // Let the app-switch transition settle before deep-linking back out.
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
}

async function openFarcasterAuthUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    throw new Error(
      `Could not open Warpcast. Install Warpcast and try again, or paste this URL in Warpcast: ${url}`,
    );
  }
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
    async (account: Account, profile?: AuthProfile) => {
      const message = await createSiweMessage(account.address);
      const signature = await account.signMessage({ message });
      const { sessionToken, user } = await postToMobileAuth(account.address, message, signature, profile);

      await persistSession({
        address: user.address.toLowerCase(),
        sessionToken,
        fid: profile?.fid ?? user.fid ?? null,
        username: profile?.username ?? user.username ?? null,
        image: profile?.image ?? user.image ?? null,
        name: profile?.name ?? user.name ?? null,
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

    await openFarcasterAuthUrl(url);

    const { data: statusData, isError: statusErr } = await appClient.watchStatus({
      channelToken,
      timeout: 300_000,
      interval: 1_500,
    });

    if (statusErr || !statusData) throw new Error("Sign-in timed out or was cancelled");

    const { custody, signature, message, fid, username, displayName, pfpUrl, nonce } =
      statusData as {
        custody: string;
        signature: string;
        message: string;
        nonce: string;
        fid?: number;
        username?: string;
        displayName?: string;
        pfpUrl?: string;
      };

    const verification = await appClient.verifySignInMessage({
      nonce,
      domain: FARCASTER_DOMAIN,
      message,
      signature: signature as `0x${string}`,
    });

    if (!verification.success) {
      throw new Error("Farcaster signature verification failed");
    }

    const profile = {
      fid: fid ?? null,
      username: username ?? null,
      image: pfpUrl ?? null,
      name: displayName ?? username ?? null,
    };
    const { sessionToken, user } = await postToMobileAuth(custody, message, signature, profile);

    await persistSession({
      address: user.address.toLowerCase(),
      sessionToken,
      fid: profile.fid ?? user.fid ?? null,
      username: profile.username ?? user.username ?? null,
      image: profile.image ?? user.image ?? null,
      name: profile.name ?? user.name ?? null,
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
      // External wallets sign over WalletConnect: wait until we're back in the
      // foreground so the personal_sign request can deep-link to the wallet.
      await waitForAppForeground();
      try {
        await signInWithAccount(account);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Failed to open URI")) {
          throw new Error(
            "We couldn't reopen your wallet automatically. Open your wallet app, approve the pending sign-in request, then return here and try again.",
          );
        }
        throw err;
      }
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

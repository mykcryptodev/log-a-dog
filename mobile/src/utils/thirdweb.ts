import { createThirdwebClient } from "thirdweb";
import { CHAIN_ID, THIRDWEB_CLIENT_ID } from "~/constants";

type ThirdwebClient = ReturnType<typeof createThirdwebClient>;

let client: ThirdwebClient | null = null;

/**
 * Whether a public Thirdweb client ID was baked into this build. Components
 * that need the client at render time must check this first — calling
 * `getThirdwebClient()` without it throws, which crashes the whole screen.
 */
export function isThirdwebConfigured(): boolean {
  return Boolean(THIRDWEB_CLIENT_ID);
}

export function getThirdwebClient() {
  if (!THIRDWEB_CLIENT_ID) {
    throw new Error(
      "Missing EXPO_PUBLIC_THIRDWEB_CLIENT_ID. Add the same public Thirdweb client ID used by the web app to mobile/.env.local or the EAS environment, then restart Expo.",
    );
  }

  client ??= createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID });
  return client;
}

export function getThirdwebChain() {
  return {
    id: CHAIN_ID,
    rpc: `https://${CHAIN_ID}.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
  } as const;
}

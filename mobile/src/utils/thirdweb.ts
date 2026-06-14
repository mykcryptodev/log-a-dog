import { createThirdwebClient } from "thirdweb";
import { CHAIN_ID, THIRDWEB_CLIENT_ID } from "~/constants";

type ThirdwebClient = ReturnType<typeof createThirdwebClient>;

let client: ThirdwebClient | null = null;

export function getThirdwebClient() {
  if (!THIRDWEB_CLIENT_ID) {
    throw new Error(
      "Missing EXPO_PUBLIC_THIRDWEB_CLIENT_ID. Add it to mobile/.env.local and restart Expo.",
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

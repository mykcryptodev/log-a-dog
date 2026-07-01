import Constants from "expo-constants";

// Cross-platform constants (contest timing, attestation rules, zero address,
// app name) come from the shared data layer so web + mobile never drift.
export {
  ZERO_ADDRESS,
  CONTEST_START_TIME,
  CONTEST_END_TIME,
  DOG_FEED_START_TIME,
  ATTESTATION_WINDOW_SECONDS,
  APP_NAME,
  APP_DESCRIPTION,
  BASE_MAINNET_ID,
  BASE_SEPOLIA_ID,
} from "@shared/constants";

// ---- Mobile-only runtime config ----

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

export const THIRDWEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID ??
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ??
  "";

export const CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_CHAIN_ID ?? "8453", 10);

export const FARCASTER_RELAY_URL = "https://relay.farcaster.xyz";
export const FARCASTER_DOMAIN = "logadog.com";
export const FARCASTER_SIWE_URI = "https://logadog.com";

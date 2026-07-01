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

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_URL =
  trimTrailingSlash(
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
      process.env.EXPO_PUBLIC_API_URL ??
      "http://localhost:3000",
  );

export const APP_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    API_URL,
);

function getDomainFromUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0] ?? "logadog.xyz";
}

export const APP_DOMAIN =
  process.env.EXPO_PUBLIC_APP_DOMAIN ??
  process.env.NEXT_PUBLIC_APP_DOMAIN ??
  getDomainFromUrl(APP_URL);

export const THIRDWEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID ??
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ??
  "";

export const CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_CHAIN_ID ?? "8453", 10);

export const FARCASTER_RELAY_URL = "https://relay.farcaster.xyz";
export const FARCASTER_DOMAIN =
  process.env.EXPO_PUBLIC_FARCASTER_DOMAIN ?? APP_DOMAIN;
export const FARCASTER_SIWE_URI =
  process.env.EXPO_PUBLIC_FARCASTER_SIWE_URI ?? `${APP_URL}/login`;

import Constants from "expo-constants";

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

export const THIRDWEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID ??
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ??
  "";

export const CHAIN_ID = parseInt(
  process.env.EXPO_PUBLIC_CHAIN_ID ?? "8453",
  10,
);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTEST_START_TIME = "2026-07-04T10:00:00-04:00";
export const CONTEST_END_TIME = "2026-09-07T23:59:00-04:00";

export const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60;

export const APP_NAME = "Log a Dog";
export const APP_DESCRIPTION = "Earn money eating hotdogs";

export const FARCASTER_RELAY_URL = "https://relay.farcaster.xyz";
export const FARCASTER_DOMAIN = "logadog.com";
export const FARCASTER_SIWE_URI = "https://logadog.com";

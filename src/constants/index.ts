import { parseEther } from "viem";

export * from "./addresses";
export * from "./chains";

// Contest timing + attestation rules are shared with the mobile app via the
// cross-platform data layer so the two never drift.
export {
  CONTEST_START_TIME,
  CONTEST_END_TIME,
  // Pre-season logs are visible and judgeable for testing, but leaderboard
  // season scoring still starts at CONTEST_START_TIME.
  DOG_FEED_START_TIME,
  ATTESTATION_WINDOW_SECONDS,
  APP_NAME,
  APP_DESCRIPTION,
} from "@shared/constants";

export const MINIMUM_STAKE = parseEther("300000");

export const DEFAULT_UPLOAD_PHRASE = '📷 Take a picture of you eating it!';

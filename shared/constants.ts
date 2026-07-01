/**
 * Cross-platform constants shared by web and mobile. Values here are the single
 * source of truth for contest timing and attestation rules; each app re-exports
 * them from its own constants module.
 *
 * No runtime deps — safe for both webpack and Metro.
 */

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTEST_START_TIME = "2026-07-04T10:00:00-04:00";
export const CONTEST_END_TIME = "2026-09-07T23:59:00-04:00";
// Pre-season logs are visible and judgeable for testing, but leaderboard
// season scoring still starts at CONTEST_START_TIME.
export const DOG_FEED_START_TIME = "2026-06-14T00:00:00-04:00";

export const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60;

export const APP_NAME = "Log a Dog";
export const APP_DESCRIPTION = "Earn money eating hotdogs";

/** Chain ids used across the stack. */
export const BASE_MAINNET_ID = 8453;
export const BASE_SEPOLIA_ID = 84532;

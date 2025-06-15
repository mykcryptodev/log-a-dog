import { parseEther } from "viem";

export * from "./addresses";
export * from "./chains";

// TODO: update start time
export const CONTEST_START_TIME = "2025-04-23T12:00:00-04:00"
export const CONTEST_END_TIME = "2025-09-05T12:00:00-04:00"

export const MINIMUM_STAKE = parseEther("100");

export const APP_NAME = "Log a Dog";
export const APP_DESCRIPTION = `Earn money eating hotdogs`;

export const DEFAULT_UPLOAD_PHRASE = '📷 Take a picture of you eating it!';

export const ATTESTATION_WINDOW_SECONDS = 3 * 60;

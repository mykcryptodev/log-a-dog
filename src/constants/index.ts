import { parseEther } from "viem";

export * from "./addresses";
export * from "./chains";

export const CONTEST_START_TIME = "2025-07-04T10:00:00-04:00"
export const CONTEST_END_TIME = "2025-09-01T23:59:00-04:00"

export const MINIMUM_STAKE = parseEther("300000");

export const APP_NAME = "Log a Dog";
export const APP_DESCRIPTION = `Earn money eating hotdogs`;

export const DEFAULT_UPLOAD_PHRASE = '📷 Take a picture of you eating it!';

export const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60;

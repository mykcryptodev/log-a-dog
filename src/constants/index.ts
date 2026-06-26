import { parseEther } from "viem";

export * from "./addresses";
export * from "./chains";

export const CONTEST_START_TIME = "2026-07-04T10:00:00-04:00"
export const CONTEST_END_TIME = "2026-09-07T23:59:00-04:00"
// Pre-season logs are visible and judgeable for testing, but leaderboard
// season scoring still starts at CONTEST_START_TIME.
export const DOG_FEED_START_TIME = "2026-06-14T00:00:00-04:00"

export const MINIMUM_STAKE = parseEther("300000");

export const APP_NAME = "Log a Dog";
export const APP_DESCRIPTION = `Earn money eating hotdogs`;

export const DEFAULT_UPLOAD_PHRASE = '📷 Take a picture of you eating it!';

export const ATTESTATION_WINDOW_SECONDS = 48 * 60 * 60;

// ---------------------------------------------------------------------------
// x402 AI analysis endpoint (`/api/x402/analyze`)
// ---------------------------------------------------------------------------
// Price the caller pays (in USDC) to have a dog log analyzed by the AI judge.
// Expressed in the x402 "Money" string format understood by thirdweb's
// `settlePayment` (resolves to USDC on the target network).
export const X402_ANALYSIS_PRICE_USD = "$0.01";

// The caller is reimbursed this multiple of what they spent, paid out in
// $HOTDOG from the reserve wallet.
export const X402_PAYOUT_MULTIPLIER = 2n;

// "Surplus Intelligence" OpenAI-compatible inference endpoint, paid per-call
// via x402. Used to ask the model whether the dog image shows a hotdog.
export const SURPLUS_INFERENCE_URL =
  "https://www.surplusintelligence.ai/x402/api/inference/v1/chat/completions";

// Vision-capable model id requested from Surplus. Override with SURPLUS_MODEL.
export const SURPLUS_MODEL = "meta-llama/Llama-3.2-90B-Vision-Instruct";

// Safety cap (USDC base units, 6 decimals) on a single inference payment so a
// misbehaving facilitator can never drain the inference wallet. $0.10.
export const X402_INFERENCE_MAX_USDC = 100_000n;

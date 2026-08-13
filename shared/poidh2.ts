/**
 * Second POIDH campaign — a single-day event on August 14, 2026 with three
 * $50 ETH bounty winners. The Fourth of July campaign lives in `./poidh.ts`;
 * the two are kept separate so each keeps its own dates, copy, and banner.
 */

/** Bounty landing page for the August 14 campaign. */
export const POIDH2_BOUNTY_URL = "https://poidh.xyz";

/** ETH prize (in USD) awarded to each winner. */
export const POIDH2_PRIZE_USD = 50;

/** Number of winners picked on the campaign day. */
export const POIDH2_WINNER_COUNT = 3;

/** Visible through August 14, 2026 11:59pm Pacific; hidden from August 15 onward. */
const POIDH2_CAMPAIGN_END = new Date("2026-08-15T00:00:00-07:00");

export function isPoidh2CampaignLive(date: Date = new Date()): boolean {
  return date.getTime() < POIDH2_CAMPAIGN_END.getTime();
}

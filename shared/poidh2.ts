/**
 * Second POIDH campaign — Friday through Sunday, August 14–16, 2026, with one
 * $50 ETH bounty winner picked each day. The Fourth of July campaign lives in
 * `./poidh.ts`; the two are kept separate so each keeps its own dates, copy,
 * and banner.
 */

/** Bounty landing page for the August 14–16 campaign. */
export const POIDH2_BOUNTY_URL = "https://poidh.xyz";

/** ETH prize (in USD) awarded to each day's winner. */
export const POIDH2_PRIZE_USD = 50;

/** Campaign days — one winner is picked from each. */
export const POIDH2_CAMPAIGN_DAYS = [
  { label: "Friday", date: "August 14" },
  { label: "Saturday", date: "August 15" },
  { label: "Sunday", date: "August 16" },
] as const;

/** Total winners across the campaign: one per day. */
export const POIDH2_WINNER_COUNT = POIDH2_CAMPAIGN_DAYS.length;

/** Visible through August 16, 2026 11:59pm Pacific; hidden from August 17 onward. */
const POIDH2_CAMPAIGN_END = new Date("2026-08-17T00:00:00-07:00");

export function isPoidh2CampaignLive(date: Date = new Date()): boolean {
  return date.getTime() < POIDH2_CAMPAIGN_END.getTime();
}

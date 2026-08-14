/**
 * Second POIDH campaign — Friday through Sunday, August 14–16, 2026, with one
 * $50 ETH bounty winner picked each day. The Fourth of July campaign lives in
 * `./poidh.ts`; the two are kept separate so each keeps its own dates, copy,
 * and banner.
 */

/** POIDH landing page — fallback for days whose bounty isn't posted yet. */
const POIDH2_HOME_URL = "https://poidh.xyz";

/**
 * Campaign days — one winner is picked from each. Each day gets its own POIDH
 * bounty; fill in `bountyUrl` as the organizers post them.
 */
export const POIDH2_CAMPAIGN_DAYS = [
  {
    label: "Friday",
    date: "August 14",
    dayOfMonth: 14,
    bountyUrl: "https://poidh.xyz/base/bounty/1318",
  },
  { label: "Saturday", date: "August 15", dayOfMonth: 15, bountyUrl: null },
  { label: "Sunday", date: "August 16", dayOfMonth: 16, bountyUrl: null },
] as const;

/** ETH prize (in USD) awarded to each day's winner. */
export const POIDH2_PRIZE_USD = 50;

/** Total winners across the campaign: one per day. */
export const POIDH2_WINNER_COUNT = POIDH2_CAMPAIGN_DAYS.length;

/** Used before the campaign starts and for server-rendered markup. */
export const DEFAULT_POIDH2_BOUNTY_URL = POIDH2_CAMPAIGN_DAYS[0].bountyUrl;

/** The bounty for the given day, falling back to the opening day's bounty. */
export function getPoidh2BountyUrl(date: Date = new Date()): string {
  const isAugust2026 = date.getFullYear() === 2026 && date.getMonth() === 7;
  if (!isAugust2026) return DEFAULT_POIDH2_BOUNTY_URL;

  const today = POIDH2_CAMPAIGN_DAYS.find(
    (day) => day.dayOfMonth === date.getDate(),
  );
  if (!today) return DEFAULT_POIDH2_BOUNTY_URL;

  // Days whose bounty isn't posted yet point at the POIDH home page.
  return today.bountyUrl ?? POIDH2_HOME_URL;
}

/** Visible through August 16, 2026 11:59pm Pacific; hidden from August 17 onward. */
const POIDH2_CAMPAIGN_END = new Date("2026-08-17T00:00:00-07:00");

export function isPoidh2CampaignLive(date: Date = new Date()): boolean {
  return date.getTime() < POIDH2_CAMPAIGN_END.getTime();
}

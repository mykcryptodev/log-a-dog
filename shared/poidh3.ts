/**
 * Third POIDH campaign — Friday through Monday, September 4–7, 2026 (Labor Day
 * weekend), with one $50 ETH bounty winner picked each day. The Fourth of July
 * campaign lives in `./poidh.ts` and round two in `./poidh2.ts`; the three are
 * kept separate so each keeps its own dates, copy, and banner.
 */

/** POIDH landing page — fallback for days whose bounty isn't posted yet. */
const POIDH3_HOME_URL = "https://poidh.xyz";

/**
 * Campaign days — one winner is picked from each. Each day gets its own POIDH
 * bounty; fill in `bountyUrl` as the organizers post them.
 */
export const POIDH3_CAMPAIGN_DAYS = [
  {
    label: "Friday",
    date: "September 4",
    dayOfMonth: 4,
    bountyUrl: "https://poidh.xyz/base/bounty/1358",
  },
  {
    label: "Saturday",
    date: "September 5",
    dayOfMonth: 5,
    bountyUrl: "https://poidh.xyz/base/bounty/1363",
  },
  {
    label: "Sunday",
    date: "September 6",
    dayOfMonth: 6,
    bountyUrl: "https://poidh.xyz/base/bounty/1366",
  },
  {
    label: "Monday",
    date: "September 7",
    dayOfMonth: 7,
    bountyUrl: null,
  },
] as const;

/** ETH prize (in USD) awarded to each day's winner. */
export const POIDH3_PRIZE_USD = 50;

/** Total winners across the campaign: one per day. */
export const POIDH3_WINNER_COUNT = POIDH3_CAMPAIGN_DAYS.length;

/** Used before the campaign starts and for server-rendered markup. */
export const DEFAULT_POIDH3_BOUNTY_URL = POIDH3_CAMPAIGN_DAYS[0].bountyUrl;

/** The bounty for the given day, falling back to the opening day's bounty. */
export function getPoidh3BountyUrl(date: Date = new Date()): string {
  const isSeptember2026 = date.getFullYear() === 2026 && date.getMonth() === 8;
  if (!isSeptember2026) return DEFAULT_POIDH3_BOUNTY_URL;

  const today = POIDH3_CAMPAIGN_DAYS.find(
    (day) => day.dayOfMonth === date.getDate(),
  );
  if (!today) return DEFAULT_POIDH3_BOUNTY_URL;

  // Days whose bounty isn't posted yet point at the POIDH home page.
  return today.bountyUrl ?? POIDH3_HOME_URL;
}

/** Visible through September 7, 2026 11:59pm Pacific; hidden from September 8 onward. */
const POIDH3_CAMPAIGN_END = new Date("2026-09-08T00:00:00-07:00");

export function isPoidh3CampaignLive(date: Date = new Date()): boolean {
  return date.getTime() < POIDH3_CAMPAIGN_END.getTime();
}

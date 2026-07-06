const POIDH_BOUNTY_URLS = {
  default: "https://poidh.xyz/base/bounty/1274",
  july4: "https://poidh.xyz/base/bounty/1277",
  july5: "https://poidh.xyz/base/bounty/1281",
} as const;

export const DEFAULT_POIDH_BOUNTY_URL = POIDH_BOUNTY_URLS.default;

export function getPoidhBountyUrl(date: Date = new Date()): string {
  const is2026July = date.getFullYear() === 2026 && date.getMonth() === 6;
  if (is2026July && date.getDate() === 4) return POIDH_BOUNTY_URLS.july4;
  if (is2026July && date.getDate() === 5) return POIDH_BOUNTY_URLS.july5;
  return POIDH_BOUNTY_URLS.default;
}

/** Visible through July 5, 2026 11:59pm Pacific; hidden from July 6 onward. */
const POIDH_CAMPAIGN_END = new Date("2026-07-06T00:00:00-07:00");

export function isPoidhCampaignLive(date: Date = new Date()): boolean {
  return date.getTime() < POIDH_CAMPAIGN_END.getTime();
}

export const POIDH_PRIZE_WINNERS = [
  { logId: "2123", prizeUsd: 50 },
  { logId: "2124", prizeUsd: 50 },
  { logId: "2093", prizeUsd: 50 },
] as const;

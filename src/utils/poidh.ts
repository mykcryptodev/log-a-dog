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

// Campaign runs July 3-5, 2026, ending at midnight Pacific (PDT, UTC-7) on July 5th.
const POIDH_CAMPAIGN_END = new Date("2026-07-06T00:00:00-07:00");

export function isPoidhCampaignLive(date: Date = new Date()): boolean {
  return date.getTime() < POIDH_CAMPAIGN_END.getTime();
}

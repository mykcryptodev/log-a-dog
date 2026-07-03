const POIDH_BOUNTY_URLS = {
  default: "https://poidh.xyz/base/bounty/1274",
  july4: "https://poidh.xyz/base/bounty/1277",
} as const;

export const DEFAULT_POIDH_BOUNTY_URL = POIDH_BOUNTY_URLS.default;

export function getPoidhBountyUrl(date: Date = new Date()): string {
  const isJuly4 =
    date.getFullYear() === 2026 &&
    date.getMonth() === 6 &&
    date.getDate() === 4;

  return isJuly4 ? POIDH_BOUNTY_URLS.july4 : POIDH_BOUNTY_URLS.default;
}

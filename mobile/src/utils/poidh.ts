const POIDH_BOUNTY_URLS = {
  default: "https://poidh.xyz/base/bounty/1274",
  july4: "https://poidh.xyz/base/bounty/1277",
  july5: "https://poidh.xyz/base/bounty/1281",
} as const;

export function getPoidhBountyUrl(date: Date = new Date()): string {
  const is2026July = date.getFullYear() === 2026 && date.getMonth() === 6;
  if (is2026July && date.getDate() === 4) return POIDH_BOUNTY_URLS.july4;
  if (is2026July && date.getDate() === 5) return POIDH_BOUNTY_URLS.july5;
  return POIDH_BOUNTY_URLS.default;
}

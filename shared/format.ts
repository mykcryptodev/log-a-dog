/**
 * Platform-agnostic formatting + display helpers shared by web and mobile.
 * No React / RN / Node imports so both bundlers can consume it.
 */

/** Relative "time ago" label (e.g. "5m", "3h", "2d") from a unix-seconds string. */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return `${Math.max(diffSecs, 0)}s`;
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h`;
  if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d`;
  return date.toLocaleDateString();
}

/** Truncated 0x address, e.g. 0x1234…abcd. */
export function formatAddress(address?: string | null): string {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Human-readable HOTDOG stake amount from a wei string (18 decimals). */
export function formatStake(stakeWei: string): string {
  const num = BigInt(stakeWei);
  const millions = Number(num) / 1e24;
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)}B`;
  if (millions >= 1) return `${millions.toFixed(1)}M`;
  const thousands = Number(num) / 1e21;
  if (thousands >= 1) return `${thousands.toFixed(1)}K`;
  return stakeWei;
}

/** Preferred display name for a profile, falling back to a truncated address. */
export function getDisplayName(
  profile?: { name?: string | null; username?: string | null } | null,
  address?: string,
): string {
  if (profile?.name) return profile.name;
  if (profile?.username) return `@${profile.username}`;
  if (address) return formatAddress(address);
  return "Unknown";
}

/** Whether `now` falls inside an attestation/voting window (unix-seconds strings). */
export function isInAttestationWindow(
  startTime: string,
  endTime: string,
  now: number = Date.now() / 1000,
): boolean {
  const start = Number(startTime);
  const end = Number(endTime);
  return now >= start && now <= end;
}

/** Split valid/invalid stake counts into rounded percentages that sum to ~100. */
export function getVotePct(
  validStr: string,
  invalidStr: string,
): { validPct: number; invalidPct: number } {
  const valid = Number(validStr);
  const invalid = Number(invalidStr);
  const total = valid + invalid;
  if (total === 0) return { validPct: 50, invalidPct: 50 };
  const validPct = Math.round((valid / total) * 100);
  return { validPct, invalidPct: 100 - validPct };
}

/** Normalize an ipfs:// URI to a public gateway https URL. */
export function convertIpfsToHttps(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url;
}

/** Abbreviated fiat/number label, e.g. 1.2K / 3.4M / 5.6B. */
export function formatAbbreviatedFiat(amount: number): string {
  if (amount < 1000) return amount.toFixed(2);
  if (amount < 1_000_000) return (amount / 1000).toFixed(2) + "K";
  if (amount < 1_000_000_000) return (amount / 1_000_000).toFixed(2) + "M";
  return (amount / 1_000_000_000).toFixed(2) + "B";
}

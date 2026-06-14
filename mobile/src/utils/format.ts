export function formatTimestamp(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return `${diffSecs}s`;
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h`;
  if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d`;
  return date.toLocaleDateString();
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatStake(stakeWei: string): string {
  const num = BigInt(stakeWei);
  const millions = Number(num) / 1e24;
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)}B`;
  if (millions >= 1) return `${millions.toFixed(1)}M`;
  const thousands = Number(num) / 1e21;
  if (thousands >= 1) return `${thousands.toFixed(1)}K`;
  return stakeWei;
}

export function getDisplayName(
  profile?: {
    name?: string | null;
    username?: string | null;
  } | null,
  address?: string,
): string {
  if (profile?.name) return profile.name;
  if (profile?.username) return `@${profile.username}`;
  if (address) return formatAddress(address);
  return "Unknown";
}

export function isInAttestationWindow(
  startTime: string,
  endTime: string,
): boolean {
  const now = Date.now() / 1000;
  const start = Number(startTime);
  const end = Number(endTime);
  return now >= start && now <= end;
}

export function getVotePct(
  validStr: string,
  invalidStr: string,
): { validPct: number; invalidPct: number } {
  const valid = Number(validStr);
  const invalid = Number(invalidStr);
  const total = valid + invalid;
  if (total === 0) return { validPct: 50, invalidPct: 50 };
  return {
    validPct: Math.round((valid / total) * 100),
    invalidPct: Math.round((invalid / total) * 100),
  };
}

export function convertIpfsToHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url;
}

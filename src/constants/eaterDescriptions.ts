// Optional, reusable-per-eater descriptions shown on celebrity pages next to
// the eater's live Farcaster bio.
//
// Keyed by the eater's (lowercased) wallet address, so a description written
// once is reused on every celebrity page that features that eater. These are
// provided by myk and persist until he supplies a new one for that eater — the
// Farcaster bio, by contrast, is always fetched fresh at page load.
export const EATER_DESCRIPTIONS: Record<string, string> = {
  // "0xeateraddress...": "Two-time backyard hotdog champion.",
};

export function getEaterDescription(address: string): string | null {
  return EATER_DESCRIPTIONS[address.toLowerCase()] ?? null;
}

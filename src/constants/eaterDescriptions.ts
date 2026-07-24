// Optional, reusable-per-eater descriptions shown on celebrity pages next to
// the eater's live Farcaster bio.
//
// Keyed by the eater's (lowercased) wallet address, so a description written
// once is reused on every celebrity page that features that eater. These are
// provided by myk and persist until he supplies a new one for that eater — the
// Farcaster bio, by contrast, is snapshotted once and served from the DB.
export const EATER_DESCRIPTIONS: Record<string, string> = {
  // Cool Beans (fid 369904)
  "0x7f928751b5abcaed3beb47d29b88d4afe6aaa3eb":
    "Cool Beans is the Log a Dog Season 1 champion and came in third place in Season 2. He has a chip on shoulder and has came out swinging in Season 3. Usually found chowin down in the deserts of America, Cool Beans is a force to be reckoned with!",
  // Alex (fid 501801)
  "0xfa45023c7349c21f2e0cb66bfb7076381793a914":
    "Alex is back for his second consecutive season of Log a Dog! Season 2 was not without drama. Alex reclaimed his honor by owning up to fudging some numbers in Season 2 and because of his willingness to do so, he is welcomed back into the competition with open arms. Alex has been spotted logging dogs all over town including one that netted him $50 for guzzling one down at the World Cup!",
  // Edux (fid 368278)
  "0x8a75ba69bc76e2e8eed53901b42688205bc214e5":
    "Edux is back for his second season of Log a Dog! A staple of the Log a Dog community, Edux pocketed ~$230 for his efforts in Season 2. Do not sleep on this competitor, he is out for blood! (and dogs!)",
};

export function getEaterDescription(address: string): string | null {
  return EATER_DESCRIPTIONS[address.toLowerCase()] ?? null;
}

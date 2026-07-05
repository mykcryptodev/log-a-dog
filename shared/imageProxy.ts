/**
 * Host suffixes allowed through `/api/image-proxy`. Keep this list in sync with
 * client-side `shouldProxyUrl` checks — the API must reject anything else to
 * avoid operating as an open proxy (a common cause of ISP/security blocklists).
 */
export const PROXY_ALLOWED_HOST_SUFFIXES = [
  "choicecdn.com",
  "pbs.twimg.com",
  "neynar.com",
  "magic.decentralized-content.com",
] as const;

export function isAllowedProxyUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    return PROXY_ALLOWED_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

export function shouldProxyUrl(url: string): boolean {
  return isAllowedProxyUrl(url);
}

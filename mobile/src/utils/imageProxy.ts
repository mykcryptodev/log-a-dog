import { API_URL } from "~/constants";

const CORS_PROBLEMATIC_DOMAINS = [
  "scontent-iad4-1.choicecdn.com",
  "scontent.choicecdn.com",
  "choicecdn.com",
  "pbs.twimg.com",
  "neynar.com",
  "magic.decentralized-content.com",
];

export function shouldProxyUrl(url: string): boolean {
  if (!url) return false;

  try {
    const hostname = new URL(url).hostname;
    return CORS_PROBLEMATIC_DOMAINS.some((domain) =>
      hostname.includes(domain),
    );
  } catch {
    return false;
  }
}

/** Absolute image-proxy URL for mobile (web uses a relative `/api/image-proxy`). */
export function getMobileProxiedUrl(url: string): string {
  if (!url) return url;
  if (shouldProxyUrl(url)) {
    return `${API_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

import { resolveScheme } from "thirdweb/storage";
import { convertIpfsToHttps } from "@shared/format";
import { getMobileProxiedUrl } from "~/utils/imageProxy";
import { getThirdwebClient, isThirdwebConfigured } from "~/utils/thirdweb";

function tryThirdwebResolve(uri: string): string | null {
  if (!uri.startsWith("ipfs://") || !isThirdwebConfigured()) return null;
  try {
    return resolveScheme({ client: getThirdwebClient(), uri });
  } catch {
    return null;
  }
}

function resolveMediaUrl(url: string): string {
  return tryThirdwebResolve(url) ?? convertIpfsToHttps(url) ?? url;
}

/**
 * Ordered image URLs to try for a hotdog photo. Mirrors web HotdogImage:
 * Zora preview first, then raw upload via Thirdweb gateway (critical for
 * freshly mobile-uploaded ipfs:// URIs), then public gateways and proxy.
 */
export function getHotdogImageCandidates(
  preview: string | null | undefined,
  rawImageUri: string | null | undefined,
): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const push = (url: string | null | undefined) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    candidates.push(url);
  };

  if (preview) {
    const resolved = resolveMediaUrl(preview);
    push(getMobileProxiedUrl(resolved));
    push(resolved);
  }

  if (rawImageUri) {
    const thirdweb = tryThirdwebResolve(rawImageUri);
    push(thirdweb);
    if (thirdweb) push(getMobileProxiedUrl(thirdweb));

    const ipfsIo = convertIpfsToHttps(rawImageUri);
    push(ipfsIo);
    if (ipfsIo) push(getMobileProxiedUrl(ipfsIo));

    if (!rawImageUri.startsWith("ipfs://")) {
      push(getMobileProxiedUrl(rawImageUri));
      push(rawImageUri);
    }
  }

  return candidates;
}

/**
 * Primary display URL for a hotdog photo. Prefer `getHotdogImageCandidates`
 * with onError fallback when rendering — a single URL is not always enough.
 */
export function resolveHotdogImage(
  preview: string | null | undefined,
  rawImageUri: string | null | undefined,
): string | null {
  return getHotdogImageCandidates(preview, rawImageUri)[0] ?? null;
}

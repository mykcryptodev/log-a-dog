import { resolveScheme } from "thirdweb/storage";
import { convertIpfsToHttps } from "@shared/format";
import { getThirdwebClient, isThirdwebConfigured } from "~/utils/thirdweb";

/**
 * Resolve a hotdog's display image. Prefers the Zora coin's cached preview
 * image; falls back to the raw upload. A freshly logged dog has no Zora coin
 * media yet (indexing lag), so it falls back to `imageUri` — a thirdweb-hosted
 * `ipfs://` URI. That only resolves reliably through thirdweb's own gateway
 * (same infra that received the upload); a generic public gateway like
 * ipfs.io often hasn't picked up the content yet, which is why the newest
 * log's photo showed up on web (thirdweb `MediaRenderer`/`resolveScheme`) but
 * not on mobile (plain `ipfs://` -> `ipfs.io` string swap).
 */
export function resolveHotdogImage(
  preview: string | null | undefined,
  rawImageUri: string | null | undefined,
): string | null {
  if (preview) return convertIpfsToHttps(preview);
  if (!rawImageUri) return null;

  if (rawImageUri.startsWith("ipfs://") && isThirdwebConfigured()) {
    try {
      return resolveScheme({ client: getThirdwebClient(), uri: rawImageUri });
    } catch {
      return convertIpfsToHttps(rawImageUri);
    }
  }

  return convertIpfsToHttps(rawImageUri);
}

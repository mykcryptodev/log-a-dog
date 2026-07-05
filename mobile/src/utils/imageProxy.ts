import { shouldProxyUrl } from "@shared/imageProxy";
import { API_URL } from "~/constants";

export { shouldProxyUrl } from "@shared/imageProxy";

/** Absolute image-proxy URL for mobile (web uses a relative `/api/image-proxy`). */
export function getMobileProxiedUrl(url: string): string {
  if (!url) return url;
  if (shouldProxyUrl(url)) {
    return `${API_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

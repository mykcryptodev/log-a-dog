import { shouldProxyUrl } from "@shared/imageProxy";

export { shouldProxyUrl } from "@shared/imageProxy";

// Helper function to get the proxied URL
export const getProxiedUrl = (url: string): string => {
  if (!url) return url;

  if (shouldProxyUrl(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

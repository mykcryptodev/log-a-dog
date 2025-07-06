import { env } from "~/env";

export interface ReverseImageSearchResult {
  matches: string[];
}

/**
 * Performs a reverse image search using Google Vision's Web Detection API.
 * Returns any matching image URLs found on the web.
 */
export async function reverseImageSearch(imageUrl: string): Promise<ReverseImageSearchResult> {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_VISION_API_KEY}`;

  // Convert IPFS URIs to a gateway URL that Google can access
  const normalizedUrl = imageUrl.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${imageUrl.replace("ipfs://", "")}`
    : imageUrl;

  const body = {
    requests: [
      {
        image: { source: { imageUri: normalizedUrl } },
        features: [{ type: "WEB_DETECTION", maxResults: 5 }],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Google Vision error ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const detection = data?.responses?.[0]?.webDetection;
    const full = detection?.fullMatchingImages ?? [];
    const partial = detection?.partialMatchingImages ?? [];
    const matches = [...full, ...partial].map((m: { url: string }) => m.url);
    return { matches };
  } catch (err) {
    console.error("Reverse image search failed", err);
    return { matches: [] };
  }
}

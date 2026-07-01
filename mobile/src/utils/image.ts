import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

/** Convert HEIC/HEIF (and other formats) to JPEG for upload pipelines. */
export async function normalizeImageUri(uri: string): Promise<string> {
  const lower = uri.toLowerCase();
  if (!lower.includes(".heic") && !lower.includes(".heif")) {
    return uri;
  }
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

// Match the web Upload component: images are shrunk to ≤0.5MB before the
// base64 safety check and IPFS upload. A full-res camera photo sent as base64
// blows past the API's request-body limit, which comes back as a plain-text
// error the tRPC client can't parse ("JSON Parse error: Unexpected character").
const MAX_UPLOAD_BYTES = 0.5 * 1024 * 1024;
const MAX_DIMENSION = 1600;

async function fileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  return info.exists && typeof info.size === "number" ? info.size : 0;
}

/**
 * Re-encode an image as JPEG and progressively downscale/compress it until it
 * fits under the upload size cap. Returns the original URI only if it is
 * already a small-enough JPEG.
 */
export async function compressImageForUpload(uri: string): Promise<string> {
  const isJpeg = /\.jpe?g$/i.test(uri.split("?")[0] ?? "");
  const initialSize = await fileSize(uri);
  if (isJpeg && initialSize > 0 && initialSize <= MAX_UPLOAD_BYTES) {
    return uri;
  }

  // Probe dimensions (and normalize to JPEG) without resizing, so small
  // images are never upscaled.
  const probe = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  let best = probe.uri;
  if ((await fileSize(best)) <= MAX_UPLOAD_BYTES) {
    return best;
  }

  let width = Math.min(probe.width, MAX_DIMENSION);
  let quality = 0.8;

  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await ImageManipulator.manipulateAsync(
      probe.uri,
      [{ resize: { width } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    );
    best = result.uri;
    const size = await fileSize(best);
    if (size > 0 && size <= MAX_UPLOAD_BYTES) {
      return best;
    }
    quality = Math.max(0.2, quality - 0.15);
    width = Math.max(640, Math.round(width * 0.8));
  }

  return best;
}

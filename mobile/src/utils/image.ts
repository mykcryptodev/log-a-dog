import * as ImageManipulator from "expo-image-manipulator";

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

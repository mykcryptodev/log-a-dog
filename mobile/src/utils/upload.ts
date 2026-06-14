import { upload } from "thirdweb/storage";
import { getThirdwebClient } from "~/utils/thirdweb";

export async function uploadImageToIPFS(localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  // thirdweb/storage `upload` supports Blob/File in React Native via the adapter
  const uris = await upload({
    client: getThirdwebClient(),
    files: [new File([blob], "hotdog.jpg", { type: "image/jpeg" })],
  });

  const uri = Array.isArray(uris) ? uris[0] : uris;
  if (!uri) throw new Error("Upload returned no URI");
  return uri;
}

export async function uploadMetadataToIPFS(metadata: {
  name: string;
  description: string;
  image: string;
}): Promise<string> {
  const uris = await upload({
    client: getThirdwebClient(),
    files: [metadata],
  });

  const uri = Array.isArray(uris) ? uris[0] : uris;
  if (!uri) throw new Error("Metadata upload returned no URI");
  return uri;
}

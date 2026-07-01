import { uploadMobile } from "thirdweb/storage";
import { getThirdwebClient } from "~/utils/thirdweb";

// thirdweb's `upload()` only supports browser/node and throws
// "Please, use the uploadMobile function in mobile environments." in React
// Native, so both helpers must go through `uploadMobile`.

export async function uploadImageToIPFS(localUri: string): Promise<string> {
  const uris = await uploadMobile({
    client: getThirdwebClient(),
    files: [{ name: "hotdog.jpg", type: "image/jpeg", uri: localUri }],
  });

  const uri = uris[0];
  if (!uri) throw new Error("Upload returned no URI");
  return uri;
}

export async function uploadMetadataToIPFS(metadata: {
  name: string;
  description: string;
  image: string;
}): Promise<string> {
  const uris = await uploadMobile({
    client: getThirdwebClient(),
    files: [metadata],
  });

  const uri = uris[0];
  if (!uri) throw new Error("Metadata upload returned no URI");
  return uri;
}

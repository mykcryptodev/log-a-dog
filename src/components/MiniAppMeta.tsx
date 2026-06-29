import Head from "next/head";
import {
  type MiniAppEmbedMetadata,
  toFrameEmbedMetadata,
} from "~/constants/miniapp";

export function MiniAppMeta({ metadata }: { metadata: MiniAppEmbedMetadata }) {
  const frameMetadata = toFrameEmbedMetadata(metadata);

  return (
    <Head>
      <meta name="fc:miniapp" content={JSON.stringify(metadata)} />
      <meta name="fc:frame" content={JSON.stringify(frameMetadata)} />
    </Head>
  );
}

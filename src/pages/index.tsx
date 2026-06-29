import Head from "next/head";
import { ListAttestations } from "~/components/Attestation/List";
import { MiniAppMeta } from "~/components/MiniAppMeta";
import {
  buildMiniAppEmbedMetadata,
  MINIAPP_HOME_IMAGE_URL,
} from "~/constants/miniapp";

const miniAppMetadata = buildMiniAppEmbedMetadata({
  imageUrl: MINIAPP_HOME_IMAGE_URL,
  launchUrl: "https://www.logadog.xyz",
});

// This generates the page at build time with ISR (recommended for better performance)
export const getStaticProps = async () => {
  return {
    props: {},
    // The homepage fetches dynamic data client-side so the
    // static HTML can be cached indefinitely without revalidation
  };
};

export default function Home() {
  return (
    <>
      <MiniAppMeta metadata={miniAppMetadata} />
      <Head>
        <title>Log a Dog — the internet&apos;s summer hotdog-eating sport</title>
        <meta
          name="description"
          content="The internet's summer hotdog-eating sport. Log a dog, get judged, climb the board."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Feed-first: the first paint is a dog, not a press release. */}
      <main className="flex flex-col items-center px-4 pt-4">
        <div className="w-full max-w-xl">
          <ListAttestations limit={10} />
        </div>
      </main>
    </>
  );
}

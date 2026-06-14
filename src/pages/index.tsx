import Head from "next/head";
import { ListAttestations } from "~/components/Attestation/List";

const miniAppMetadata = {
  version: "next",
  imageUrl: "https://logadog.xyz/images/og-image.png",
  button: {
    title: "🌭 Log a Dog",
    action: {
      type: "launch_frame",
      name: "Log a Dog",
      url: `https://logadog.xyz`,
      splashImageUrl: "https://logadog.xyz/images/logo.png",
      splashBackgroundColor: "#faf8f7",
    },
  },
};

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
      <Head>
        <title>Log a Dog — the internet&apos;s summer hotdog-eating sport</title>
        <meta
          name="description"
          content="The internet's summer hotdog-eating sport. Log a dog, get judged, climb the board."
        />
        <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
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

import Head from "next/head";
import Link from "next/link";
// import Link from "next/link";
import { useState, useEffect } from "react";
import { CreateAttestation } from "~/components/Attestation/Create";
import { ListAttestations } from "~/components/Attestation/List";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import { APP_DESCRIPTION } from "~/constants";
import Image from "next/image";
import LeaderboardList from "~/components/LeaderboardList";

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
  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUserPrefersDarkMode(
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }, []);

  const bannerSrc =
    mounted && userPrefersDarkMode
      ? '/images/banner-dark.png'
      : '/images/banner.png';

  return (
    <>
      <Head>
        <title>Log a Dog</title>
        <meta name="description" content="Track how many hotdogs you eat and compete against your friends!" />
        <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LeaderboardBanner />
        <div className="container flex flex-col items-center justify-center gap-4 px-4 pt-8 pb-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] flex items-center">
            <Image
              src={bannerSrc}
              alt="Log a Dog"
              width={500}
              height={500}
              priority
            />
          </h1>
          <div className="flex items-center gap-2 -mt-8">
            <p className="sm:text-lg text-sm text-center max-w-xs">{APP_DESCRIPTION}</p>
            <Link href="/faq" className="text-xs underline">wtf?</Link>
          </div>
          <CreateAttestation />
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-center">Leaderboard</h2>
            <LeaderboardList limit={10} />
          </div>
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-center">Logs</h2>
            <ListAttestations limit={10} />
          </div>
        </div>
      </main>
    </>
  );
}
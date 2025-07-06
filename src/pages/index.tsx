import Head from "next/head";
import Link from "next/link";
// import Link from "next/link";
import { useState, useEffect } from "react";
import { CreateAttestation } from "~/components/Attestation/Create";
import { ListAttestations } from "~/components/Attestation/List";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import { APP_DESCRIPTION } from "~/constants";
import Image from "next/image";
import { NotificationsSettings } from "~/components/Notifications/Settings";

const miniAppMetadata = {
  version: "next",
  imageUrl: "https://logadog.xyz/images/og-image.png",
  button: {
    title: "🌭 Log a Dog",
    action: {
      type: "launch_frame",
      name: "Log a Dog",
      url: `https://log-a-dog-git-noti-mykcryptodevs-projects.vercel.app`,
      splashImageUrl: "https://logadog.xyz/images/logo.png",
      splashBackgroundColor: "#faf8f7",
    },
  },
};

// This generates the page at build time with ISR (recommended for better performance)
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60, // Revalidate every 60 seconds
  };
};

export default function Home() {
  const [refetchTimestamp, setRefetchTimestamp] = useState<number>(0);
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
        <LeaderboardBanner refetchTimestamp={refetchTimestamp} />
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


          <CreateAttestation
            onAttestationCreated={() => {
              // give the blockchain 10 seconds to confirm
              setTimeout(() => {
                setRefetchTimestamp(new Date().getTime())
              }, 10000);
            }}
          />
          <ListAttestations refetchTimestamp={refetchTimestamp} limit={10} />
        </div>
      </main>
    </>
  );
}
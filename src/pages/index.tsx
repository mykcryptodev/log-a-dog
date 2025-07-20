import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
// import Link from "next/link";
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

const tabs = ["logs", "leaderboard"] as const;
export default function Home() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("logs");

  return (
    <>
      <Head>
        <title>Log a Dog</title>
        <meta
          name="description"
          content="Track how many hotdogs you eat and compete against your friends!"
        />
        <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LeaderboardBanner />
        <div className="container flex flex-col items-center justify-center gap-4 px-4 pb-8 pt-8">
          <h1 className="flex items-center text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            <Image
              src="/images/banner.png"
              alt="Log a Dog"
              width={500}
              height={500}
              priority
              className="dark:hidden"
            />
            <Image
              src="/images/banner-dark.png"
              alt="Log a Dog"
              width={500}
              height={500}
              priority
              className="hidden dark:block"
            />
          </h1>
          <div className="-mt-8 flex items-center gap-2">
            <p className="max-w-xs text-center text-sm sm:text-lg">
              {APP_DESCRIPTION}
            </p>
            <Link href="/faq" className="text-xs underline">
              wtf?
            </Link>
          </div>
          <CreateAttestation />
          <div role="tablist" className="tabs tabs-boxed">
            {tabs.map((tab) => (
              <a role="tab" className={`tab ${activeTab === tab ? "bg-secondary/50 text-secondary-content" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </a>
            ))}
          </div>
          {activeTab === "leaderboard" && (
            <div className="w-full max-w-md">
              <LeaderboardList limit={10} />
            </div>
          )}
          {activeTab === "logs" && (
            <div className="w-full max-w-md">
              <ListAttestations limit={10} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

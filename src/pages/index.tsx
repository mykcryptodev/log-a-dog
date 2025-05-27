import Head from "next/head";
// import Link from "next/link";
import { useState } from "react";
import { CreateAttestation } from "~/components/Attestation/Create";
import { ListAttestations } from "~/components/Attestation/List";
import Instructions from "~/components/Help/Instructions";
import Rules from "~/components/Help/Rules";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";

export default function Home() {
  const [refetchTimestamp, setRefetchTimestamp] = useState<number>(0);

  return (
    <>
      <Head>
        <title>Log a Dog</title>
        <meta name="description" content="Track how many hotdogs you eat and compete against your friends!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LeaderboardBanner refetchTimestamp={refetchTimestamp} />
        <div className="container flex flex-col items-center justify-center gap-12 px-4 pt-8 pb-20">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] flex items-center">
            <div>🌭 Log <span className="text-secondary">a Dog</span> </div>
          </h1>
          <CreateAttestation
            onAttestationCreated={() => {
              // give the blockchain 10 seconds to confirm
              setTimeout(() => {
                setRefetchTimestamp(new Date().getTime())
              }, 10000);
            }}
          />
          <Rules />
          <Instructions />
          <ListAttestations refetchTimestamp={refetchTimestamp} key={refetchTimestamp} limit={10} />
        </div>
      </main>
    </>
  );
}
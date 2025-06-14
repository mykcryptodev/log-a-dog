import Head from "next/head";
import Link from "next/link";
// import Link from "next/link";
import { useState } from "react";
import { CreateAttestation } from "~/components/Attestation/Create";
import { ListAttestations } from "~/components/Attestation/List";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import { APP_DESCRIPTION } from "~/constants";

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
        <div className="container flex flex-col items-center justify-center gap-6 px-4 pt-8 pb-20">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] flex items-center">
            <div>🌭 Log <span className="text-secondary">a Dog</span> </div>
          </h1>
          <div className="flex items-center gap-2 -mt-2">
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
          <ListAttestations refetchTimestamp={refetchTimestamp} key={refetchTimestamp} limit={10} />
        </div>
      </main>
    </>
  );
}
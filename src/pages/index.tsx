import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { CreateAttestation } from "~/components/Attestation/Create";
import { GlobalLeaderboard } from "~/components/Attestation/GlobalLeaderboard";
import { Leaderboard } from "~/components/Attestation/Leaderboard";
import { ListAttestations } from "~/components/Attestation/List";
import Instructions from "~/components/Help/Instructions";
import Rules from "~/components/Help/Rules";

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
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] flex items-center">
            <div>🌭 Log <span className="text-secondary">a Dog</span> </div>
            <div className="badge badge-sm badge-accent tracking-normal -mt-8 sm:ml-0 sm:-mt-16 sm:badge-md">Beta</div>
          </h1>
          <CreateAttestation
            onAttestationCreated={() => {
              // give the blockchain 5 seconds
              setTimeout(() => {
                setRefetchTimestamp(new Date().getTime())
              }, 5000);
            }}
          />
          <Rules />
          <Instructions />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              href="/contest/create"
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 cursor-pointer hover:opacity-80"
            >
              <h3 className="text-2xl font-bold">Create a Contest →</h3>
              <div className="text-lg">
                Get your friends together and see who can eat the most hot dogs.
              </div>
            </Link>
            <Link
              href="/contest/my"
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 cursor-pointer hover:opacity-80"
            >
              <h3 className="text-2xl font-bold">My Contests →</h3>
              <div className="text-lg flex flex-col">
                Contests that you are a part of. Everyone is in this global contest.
              </div>
            </Link>
          </div>
          <h3 className="text-2xl font-bold">🌎 Global Leaderboard</h3>
          {/* <Leaderboard refetchTimestamp={refetchTimestamp} /> */}
          <GlobalLeaderboard refetchTimestamp={refetchTimestamp} key={refetchTimestamp} />
          <ListAttestations refetchTimestamp={refetchTimestamp} key={refetchTimestamp} />
        </div>
      </main>
    </>
  );
}
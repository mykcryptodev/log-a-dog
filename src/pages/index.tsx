import Head from "next/head";
import { CreateAttestation } from "~/components/Attestation/Create";
import { Leaderboard } from "~/components/Attestation/Leaderboard";
import { ListAttestations } from "~/components/Attestation/List";
import { ContestForm } from "~/components/Contest/Form";

export default function Home() {
  return (
    <>
      <Head>
        <title>Log a Dog</title>
        <meta name="description" content="Track how many hotdogs you eat and compete against your friends!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            🌭 Log <span className="text-secondary">a dog</span> <div className="badge badge-accent tracking-normal">In Progress</div>
          </h1>
          <Leaderboard />
          <ContestForm action="create" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <div
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 hover:opacity-80"
            >
              <h3 className="text-2xl font-bold">Create a Contest →</h3>
              <div className="text-lg">
                Get your friends together and see who can eat the most hot dogs.
              </div>
              <CreateAttestation />
            </div>
            <div
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 hover:opacity-80"
            >
              <h3 className="text-2xl font-bold">Join a Contest →</h3>
              <div className="text-lg">
                Join your friends in an existing contest.
              </div>
              <ListAttestations />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
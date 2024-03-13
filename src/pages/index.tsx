import Head from "next/head";
import { useState } from "react";
import { CreateAttestation } from "~/components/Attestation/Create";
import { Leaderboard } from "~/components/Attestation/Leaderboard";
import { ListAttestations } from "~/components/Attestation/List";
import { ContestForm } from "~/components/Contest/Form";

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
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            🌭 Log <span className="text-secondary">a dog</span> <div className="badge badge-accent tracking-normal">In Progress</div>
          </h1>
          <CreateAttestation
            onAttestationCreated={() => {
              console.log('on create called');
              setRefetchTimestamp(Date.now());
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <div
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 cursor-pointer hover:opacity-80"
              onClick={()=>(document.getElementById('create_contest_modal') as HTMLDialogElement).showModal()}
            >
              <h3 className="text-2xl font-bold">Create a Contest →</h3>
              <div className="text-lg">
                Get your friends together and see who can eat the most hot dogs.
              </div>
              <dialog id="create_contest_modal" className="modal">
                <div className="modal-box overflow-hidden">
                  <h3 className="font-bold text-2xl mb-4">Create a Contest</h3>
                  <div className="sm:p-8 p-2">
                    <ContestForm action="create" />
                  </div>
                  <div className="modal-action">
                    <form method="dialog">
                      {/* if there is a button in form, it will close the modal */}
                      <button className="btn">Close</button>
                    </form>
                  </div>
                </div>
              </dialog>
            </div>
            <div
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 cursor-pointer hover:opacity-80"
            >
              <h3 className="text-2xl font-bold">Join a Contest →</h3>
              <div className="text-lg">
                Join your friends in an existing contest.
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-bold">🌎 Global Leaderboard</h3>
          <Leaderboard />
          <ListAttestations refetchTimestamp={refetchTimestamp} />
        </div>
      </main>
    </>
  );
}
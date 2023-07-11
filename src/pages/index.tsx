import Head from "next/head";
import Link from "next/link";

import { UploadButton } from "~/utils/uploadthing";

export default function Home() {
  return (
    <>
      <Head>
        <title>Log a Dog</title>
        <meta name="description" content="Please track" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-primary-content sm:text-[5rem]">
            🌭 Log <span className="text-secondary">a dog</span>
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 hover:opacity-80"
              href="/contest/create"
            >
              <h3 className="text-2xl font-bold">Create a Contest →</h3>
              <div className="text-lg">
                Get your friends together and see who can eat the most hot dogs.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl opacity-90 p-4 hover:opacity-80"
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Join a Contest →</h3>
              <div className="text-lg">
                Join your friends in an existing contest.
              </div>
            </Link>
          </div>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              // Do something with the response
              console.log("Files: ", res);
              alert("Upload Completed");
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>
      </main>
    </>
  );
}

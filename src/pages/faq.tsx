import Head from "next/head";
import { type NextPage } from "next";
import Instructions from "~/components/Help/Instructions";
import Rules from "~/components/Help/Rules";
import Media from "~/components/Help/Media";

const FAQPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>FAQ - Log a Dog</title>
        <meta name="description" content="Frequently asked questions, rules, and instructions for Log a Dog competition" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-6 px-4 pt-16 pb-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] flex items-center">
            <div>🌭 FAQ & <span className="text-secondary">Instructions</span></div>
          </h1>
          <p className="text-center text-lg">
            Welcome to the global hotdog eating competition!
          </p>
          
          <Rules />
          <Instructions />
          <Media />
        </div>
      </main>
    </>
  );
};

export default FAQPage; 
import Head from "next/head";
import { type NextPage } from "next";
import LeaderboardList from "~/components/LeaderboardList";

const LeaderboardPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Leaderboard - Log a Dog</title>
        <meta name="description" content="Hotdog leaderboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-6 px-4 pb-8 pt-16">
          <h1 className="flex items-center text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            🌭 Leaderboard
          </h1>
          <LeaderboardList showCurrentUser limit={10} height="500px" />
        </div>
      </main>
    </>
  );
};

export default LeaderboardPage;

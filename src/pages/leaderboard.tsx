import Head from "next/head";
import { type NextPage } from "next";
import LeaderboardList from "~/components/LeaderboardList";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import { CONTEST_START_TIME } from "~/constants";

const LeaderboardPage: NextPage = () => {
  const startDateObj = new Date(CONTEST_START_TIME);

  return (
    <>
      <Head>
        <title>Leaderboard - Log a Dog</title>
        <meta name="description" content="The Log a Dog stadium scoreboard." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center px-4 pt-6">
        <div className="flex w-full max-w-xl flex-col items-center gap-5">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            🏆 THE SCOREBOARD
          </h1>

          <LeaderboardBanner startDate={startDateObj} scrollSpeed={35} />

          <LeaderboardList
            showPodium
            showCurrentUser
            limit={25}
            height="600px"
            startDate={startDateObj}
          />
        </div>
      </main>
    </>
  );
};

export default LeaderboardPage;

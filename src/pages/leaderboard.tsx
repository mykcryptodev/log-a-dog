import Head from "next/head";
import { useState } from "react";
import { type NextPage } from "next";
import LeaderboardList from "~/components/LeaderboardList";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import PoidhPrizeWinners from "~/components/PoidhPrizeWinners";
import HotdogDayWinners from "~/components/HotdogDayWinners";
import TopDogs from "~/components/TopDogs";
import { CONTEST_START_TIME } from "~/constants";

const LeaderboardPage: NextPage = () => {
  const startDateObj = new Date(CONTEST_START_TIME);
  const [includePending, setIncludePending] = useState(false);

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

          <TopDogs />

          <HotdogDayWinners />

          <PoidhPrizeWinners />

          <label className="flex cursor-pointer items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={includePending}
              onChange={(e) => setIncludePending(e.target.checked)}
            />
            <span className="font-semibold">
              Include pending dogs 🗳️
            </span>
          </label>

          <LeaderboardList
            showPodium
            showCurrentUser
            limit={25}
            height="600px"
            startDate={startDateObj}
            includePending={includePending}
          />
        </div>
      </main>
    </>
  );
};

export default LeaderboardPage;

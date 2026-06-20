import Head from "next/head";
import { type NextPage } from "next";
import { useState } from "react";
import LeaderboardList from "~/components/LeaderboardList";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import { CONTEST_START_TIME } from "~/constants";

const TABS = ["Season", "All-time"] as const;
type Tab = (typeof TABS)[number];

const LeaderboardPage: NextPage = () => {
  const [tab, setTab] = useState<Tab>("Season");

  const startDateObj = tab === "Season" ? new Date(CONTEST_START_TIME) : undefined;

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

          <div role="tablist" className="tabs tabs-boxed bg-base-200">
            {TABS.map((t) => (
              <a
                key={t}
                role="tab"
                className={`tab font-display tracking-wide ${tab === t ? "tab-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </a>
            ))}
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/60 backdrop-blur-sm">
            <LeaderboardBanner startDate={startDateObj} scrollSpeed={35} />
          </div>

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

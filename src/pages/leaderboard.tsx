import Head from "next/head";
import { type NextPage } from "next";
import { useState } from "react";
import LeaderboardList from "~/components/LeaderboardList";

const LeaderboardPage: NextPage = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const applyDates = () => {
    /* Date filters simply trigger React state update */
  };

  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

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
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <input
              type="date"
              className="input input-bordered"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="hidden sm:inline">to</span>
            <input
              type="date"
              className="input input-bordered"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button className="btn btn-primary" onClick={applyDates}>
              Apply
            </button>
          </div>
          <LeaderboardList
            showCurrentUser
            limit={10}
            height="500px"
            startDate={startDateObj}
            endDate={endDateObj}
          />
        </div>
      </main>
    </>
  );
};

export default LeaderboardPage;

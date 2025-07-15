import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const JudgesPage: NextPage = () => {
  const { data: judges = [], isLoading } = api.ghost.getJudges.useQuery();

  return (
    <>
      <Head>
        <title>Judges - Log a Dog</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center gap-6 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            🌭 Judges
          </h1>
          {isLoading ? (
            <div className="loading loading-spinner" />
          ) : (
            <div className="w-full max-w-xl space-y-2">
              {judges.map((j, idx) => (
                <div
                  key={j.voter}
                  className="flex items-center justify-between rounded-lg bg-base-200 bg-opacity-50 p-3"
                >
                  <span className="font-bold">#{idx + 1}</span>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {j.profile.imgUrl ? (
                      <img
                        src={j.profile.imgUrl}
                        alt={j.profile.username || 'Judge'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {j.voter.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      {j.profile.username ? (
                        <>
                          <span className="font-medium truncate">{j.profile.username}</span>
                          <span className="text-xs text-gray-500 truncate">
                            {j.voter.slice(0, 6)}...{j.voter.slice(-4)}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium truncate">{j.voter}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-lg">{j.correct}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default JudgesPage;

import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import Image from "next/image";

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
            <div className="w-full max-w-6xl">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Judge</th>
                      <th>Total Votes</th>
                      <th>Correct</th>
                      <th>Incorrect</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {judges.map((j, idx) => (
                      <tr key={j.voter} className="hover">
                        <td>
                          <div className="font-bold text-lg">#{idx + 1}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                {j.profile.imgUrl ? (
                                  <Image
                                    src={j.profile.imgUrl}
                                    alt={j.profile.username || 'Judge'}
                                    width={48}
                                    height={48}
                                  />
                                ) : (
                                  <div className="bg-gray-300 opacity w-full h-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-600">
                                      {j.voter.slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">
                                {j.profile.username || j.voter}
                              </div>
                              {j.profile.username && (
                                <div className="text-sm opacity-50">
                                  {j.voter.slice(0, 6)}...{j.voter.slice(-4)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="font-bold text-lg">{j.total}</div>
                        </td>
                        <td>
                          <div className="font-bold text-lg text-success">{j.correct}</div>
                        </td>
                        <td>
                          <div className="font-bold text-lg text-error">{j.incorrect}</div>
                        </td>
                        <td>
                          <div className="font-bold text-lg">{j.accuracy.toFixed(1)}%</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default JudgesPage;

import { type NextPage } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ZERO_ADDRESS } from "thirdweb";
import { api } from "~/utils/api";
import { getProxiedUrl } from "~/utils/imageProxy";
import HotdogCard from "~/components/utils/HotdogCard";
import { ATTESTATION_WINDOW_SECONDS, DEFAULT_CHAIN } from "~/constants";

const JudgesPage: NextPage = () => {
  const isClient = typeof window !== "undefined";

  const { data: dogData, isLoading: loadingDogs, refetch } = api.hotdog.getAll.useQuery(
    { chainId: DEFAULT_CHAIN.id, user: ZERO_ADDRESS, start: 0, limit: 50 },
    { enabled: isClient, refetchOnWindowFocus: false },
  );

  const { data: judges = [], isLoading: loadingJudges } = api.ghost.getJudges.useQuery();

  // Dogs still inside their 48h voting window and not yet resolved.
  const queue = useMemo(() => {
    const hotdogs = dogData?.hotdogs ?? [];
    return hotdogs
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => {
        const open = Number(h.timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000 > Date.now();
        const unresolved = h.attestationPeriod?.status !== 1;
        return open && unresolved;
      });
  }, [dogData?.hotdogs]);

  const [cursor, setCursor] = useState(0);
  const current = queue[Math.min(cursor, queue.length - 1)];

  const next = () => setCursor((c) => (c + 1) % Math.max(queue.length, 1));

  return (
    <>
      <Head>
        <title>Judge - Log a Dog</title>
      </Head>
      <main className="flex flex-col items-center px-4 pt-6">
        <div className="flex w-full max-w-xl flex-col items-center gap-5">
          <div className="text-center">
            <h1 className="font-display text-4xl tracking-wide sm:text-5xl">🧑‍⚖️ THE JURY</h1>
            <p className="mt-1 text-sm opacity-70">
              {loadingDogs
                ? "Rounding up the suspects…"
                : queue.length > 0
                  ? `${queue.length} dog${queue.length === 1 ? "" : "s"} await your verdict. Don't let the frauds win.`
                  : "No dogs awaiting a verdict right now. The jury rests. 🛏️"}
            </p>
          </div>

          {/* Voting queue — one dog at a time */}
          {current && (
            <div className="w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.h.logId}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                >
                  <HotdogCard
                    hotdog={current.h}
                    validAttestations={dogData?.validAttestations?.[current.i] ?? "0"}
                    invalidAttestations={dogData?.invalidAttestations?.[current.i] ?? "0"}
                    userAttested={dogData?.userAttested?.[current.i] ?? false}
                    userAttestation={dogData?.userAttestations?.[current.i] ?? false}
                    chainId={DEFAULT_CHAIN.id}
                    onRefetch={() => void refetch()}
                    linkToDetail={false}
                    showAiJudgement
                  />
                </motion.div>
              </AnimatePresence>
              {queue.length > 1 && (
                <div className="mt-3 flex justify-center">
                  <button className="btn btn-ghost btn-sm font-display tracking-wide" onClick={next}>
                    Skip to next dog →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Top judges ranking */}
          <div className="w-full">
            <h2 className="mb-2 mt-4 font-display text-2xl tracking-wide">🏅 TOP JUDGES</h2>
            {loadingJudges ? (
              <div className="loading loading-spinner" />
            ) : (
              <div className="overflow-x-auto rounded-2xl bg-base-200/40 p-2">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Judge</th>
                      <th>Votes</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {judges.map((j, idx) => (
                      <tr key={j.voter} className="hover">
                        <td className="font-display text-lg tabular-nums text-secondary">{idx + 1}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="mask mask-squircle h-10 w-10">
                                {j.profile.imgUrl ? (
                                  <Image
                                    src={getProxiedUrl(j.profile.imgUrl)}
                                    alt={j.profile.username ?? "Judge"}
                                    width={40}
                                    height={40}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-base-300">
                                    <span className="text-xs font-bold">{j.voter.slice(0, 2).toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold">
                              {j.profile.username ?? `${j.voter.slice(0, 6)}...${j.voter.slice(-4)}`}
                            </span>
                          </div>
                        </td>
                        <td className="font-display tabular-nums">{j.total}</td>
                        <td className="font-display tabular-nums">{j.accuracy.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default JudgesPage;

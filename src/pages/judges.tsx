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
import { useVoterAddress } from "~/hooks/useVoterAddress";

const JudgesPage: NextPage = () => {
  const isClient = typeof window !== "undefined";
  const voterAddress = useVoterAddress();

  const {
    data: dogData,
    isLoading: loadingDogs,
    isError: dogsErrored,
    refetch,
  } = api.hotdog.getAll.useQuery(
    { chainId: DEFAULT_CHAIN.id, user: ZERO_ADDRESS, voter: voterAddress ?? ZERO_ADDRESS, start: 0, limit: 50 },
    { enabled: isClient, refetchOnWindowFocus: false, retry: 1 },
  );

  const {
    data: judges = [],
    isLoading: loadingJudges,
    isError: judgesErrored,
    refetch: refetchJudges,
  } = api.hotdog.getJudges.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
  });

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
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">🧑‍⚖️ THE JURY</h1>
            <p className="mt-1 text-sm opacity-70">
              {loadingDogs
                ? "Rounding up the suspects…"
                : dogsErrored
                  ? "The jury queue could not load right now."
                  : queue.length > 0
                  ? `${queue.length} dog${queue.length === 1 ? "" : "s"} await your verdict. Don't let the frauds win.`
                  : "No dogs awaiting a verdict right now. The jury rests. 🛏️"}
            </p>
          </div>

          {dogsErrored && (
            <div className="alert alert-warning">
              <span>Could not load dogs for judging.</span>
              <button className="btn btn-sm" onClick={() => void refetch()}>
                Retry
              </button>
            </div>
          )}

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
                  <button className="pop-btn rounded-lg bg-base-100 px-3 py-1.5 font-display text-sm tracking-wide" onClick={next}>
                    Skip to next dog →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Top judges ranking */}
          <div className="w-full">
            <h2 className="mb-3 mt-4 font-display text-2xl font-bold tracking-tight">🏅 TOP JUDGES</h2>
            {loadingJudges ? (
              <div className="pop-card space-y-2 rounded-2xl bg-base-100 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border-2 border-base-content bg-base-100 p-3">
                    <div className="grill-skeleton h-5 w-8 animate-grill-shimmer rounded" />
                    <div className="grill-skeleton h-10 w-10 animate-grill-shimmer rounded-full" />
                    <div className="grill-skeleton h-4 w-32 animate-grill-shimmer rounded-lg" />
                  </div>
                ))}
              </div>
            ) : judgesErrored ? (
              <div className="pop-card rounded-2xl bg-base-100 p-4 text-sm">
                <p className="opacity-70">Could not load judge rankings right now.</p>
                <button className="btn btn-ghost btn-sm mt-2" onClick={() => void refetchJudges()}>
                  Retry rankings
                </button>
              </div>
            ) : judges.length === 0 ? (
              <div className="pop-card rounded-2xl bg-base-100 p-4 text-sm opacity-70">
                Judge rankings are temporarily unavailable.
              </div>
            ) : (
              <div className="pop-card space-y-2 rounded-2xl bg-base-100 p-3">
                {judges.map((j, idx) => (
                  <div
                    key={j.voter}
                    className="flex items-center justify-between gap-2 rounded-xl border-2 border-base-content bg-base-100 p-3 transition-colors hover:bg-base-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-base-content bg-base-200 font-display text-base tabular-nums text-secondary">
                        {idx + 1}
                      </span>
                      <div className="pop-frame h-10 w-10 overflow-hidden rounded-full bg-base-300">
                        {j.profile.imgUrl ? (
                          <Image
                            src={getProxiedUrl(j.profile.imgUrl)}
                            alt={j.profile.username ?? "Judge"}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                            {j.voter.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold">
                        {j.profile.username ?? `${j.voter.slice(0, 6)}...${j.voter.slice(-4)}`}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-right">
                      <span className="font-display tabular-nums">{j.total} votes</span>
                      <span className="text-xs opacity-60">{j.accuracy.toFixed(1)}% accurate</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default JudgesPage;

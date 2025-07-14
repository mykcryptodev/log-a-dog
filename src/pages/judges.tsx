import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

interface Vote {
  isValid: boolean;
  logId: string;
  voter: string;
}

interface DogLog {
  id: string;
  isValid: boolean;
  invalidVotes: string;
  validVotes: string;
  status: number;
}

interface JudgeResult {
  voter: string;
  correct: number;
}

const QUERY = `query Judges($votesCursor: String, $logsCursor: String) {
  votes(after: $votesCursor, first: 100) {
    items {
      isValid
      logId
      voter
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
  dogLogs(after: $logsCursor, first: 100) {
    items {
      id
      isValid
      invalidVotes
      validVotes
      status
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}`;

const JudgesPage: NextPage = () => {
  const [judges, setJudges] = useState<JudgeResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let votesCursor: string | null = null;
      let logsCursor: string | null = null;
      const votes: Vote[] = [];
      const logs: DogLog[] = [];

      while (true) {
        const res: Response = await fetch("/api/ghostgraph", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query: QUERY,
            variables: { votesCursor, logsCursor },
          }),
        });
        const json = await res.json();
        const voteData = json.data.votes;
        const logData = json.data.dogLogs;
        if (voteData) {
          votes.push(...(voteData.items as Vote[]));
          votesCursor = voteData.pageInfo.hasNextPage
            ? (voteData.pageInfo.endCursor as string)
            : null;
        }
        if (logData) {
          logs.push(...(logData.items as DogLog[]));
          logsCursor = logData.pageInfo.hasNextPage
            ? (logData.pageInfo.endCursor as string)
            : null;
        }
        if (!votesCursor && !logsCursor) break;
      }

      const logMap = new Map<string, DogLog>();
      for (const log of logs) {
        logMap.set(log.id, log);
      }

      const counts: Record<string, number> = {};
      for (const vote of votes) {
        const log = logMap.get(vote.logId);
        if (!log) continue;
        if (log.status === 0) continue; // still pending
        const correct =
          (vote.isValid && log.isValid) || (!vote.isValid && !log.isValid);
        if (correct) {
          counts[vote.voter] = (counts[vote.voter] ?? 0) + 1;
        }
      }

      const ranking: JudgeResult[] = Object.entries(counts)
        .map(([voter, correct]) => ({ voter, correct }))
        .sort((a, b) => b.correct - a.correct);

      setJudges(ranking);
      setLoading(false);
    };

    void fetchData();
  }, []);

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
          {loading ? (
            <div className="loading loading-spinner" />
          ) : (
            <div className="w-full max-w-xl space-y-2">
              {judges.map((j, idx) => (
                <div
                  key={j.voter}
                  className="flex items-center justify-between rounded-lg bg-base-200 bg-opacity-50 p-3"
                >
                  <span className="font-bold">#{idx + 1}</span>
                  <span className="break-all">{j.voter}</span>
                  <span className="font-bold">{j.correct}</span>
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

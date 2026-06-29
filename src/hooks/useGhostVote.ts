import { useMemo } from "react";
import { api } from "~/utils/api";

export function useGhostVote(logId: string | undefined, voter: string | undefined) {
  const { data: votes } = api.hotdog.getUserVotes.useQuery(
    { voter: voter ?? "" },
    {
      enabled: !!voter,
      staleTime: 60_000,
      retry: false,
      refetchOnWindowFocus: true,
    },
  );

  return useMemo(() => {
    if (!logId || !votes) return null;
    return votes[logId] ?? null;
  }, [logId, votes]);
}

import { useMemo } from "react";
import { api } from "~/utils/api";

export function useGhostVote(logId: string | undefined, voter: string | undefined) {
  const { data: votes } = api.ghost.getUserVotes.useQuery(
    { voter: voter ?? "" },
    {
      enabled: !!voter,
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  return useMemo(() => {
    if (!logId || !votes) return null;
    return votes[logId] ?? null;
  }, [logId, votes]);
}

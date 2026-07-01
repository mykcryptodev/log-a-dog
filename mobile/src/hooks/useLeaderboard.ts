import { useMemo } from "react";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID } from "~/constants";
import { toLeaderboardEntries } from "@shared/feed";
import type { LeaderboardEntry, LeaderboardResponse } from "@shared/types";

export interface UseLeaderboardOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Mobile leaderboard hook. Mirrors the web `useLeaderboardData` hook — same
 * query, same shared `toLeaderboardEntries` transform — so both apps derive
 * ranked entries identically.
 */
export interface UseLeaderboardResult {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useLeaderboard({
  startDate,
  endDate,
  limit = 10,
}: UseLeaderboardOptions = {}): UseLeaderboardResult {
  const query = trpc.hotdog.getLeaderboard.useQuery(
    {
      chainId: CHAIN_ID,
      ...(startDate ? { startDate: Math.floor(startDate.getTime() / 1000) } : {}),
      ...(endDate ? { endDate: Math.floor(endDate.getTime() / 1000) } : {}),
    },
    { refetchOnWindowFocus: false, refetchOnMount: false },
  );

  const entries = useMemo<LeaderboardEntry[]>(
    () =>
      toLeaderboardEntries(
        query.data as LeaderboardResponse | undefined,
        limit,
      ),
    [query.data, limit],
  );

  // The tRPC client is currently untyped (`createTRPCReact<any>`), so pull the
  // query flags out through an explicitly typed result to keep consumers typed.
  return {
    entries,
    isLoading: Boolean(query.isLoading),
    isError: Boolean(query.isError),
    refetch: () => void query.refetch(),
  };
}

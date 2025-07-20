import { DEFAULT_CHAIN } from "~/constants";
import { api } from "~/utils/api";
import { useMemo } from "react";

export type UseLeaderboardOptions = {
  startDate?: Date;
  endDate?: Date;
};

export const useLeaderboardData = ({
  startDate,
  endDate,
}: UseLeaderboardOptions) => {
  const { data: leaderboard } = api.hotdog.getLeaderboard.useQuery(
    {
      chainId: DEFAULT_CHAIN.id,
      ...(startDate
        ? { startDate: Math.floor(startDate.getTime() / 1000) }
        : {}),
      ...(endDate ? { endDate: Math.floor(endDate.getTime() / 1000) } : {}),
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  // The leaderboard now includes profile data directly, so we can return it
  const profiles = useMemo(() => {
    return leaderboard?.profiles ?? [];
  }, [leaderboard?.profiles]);

  return { leaderboard, profiles };
};

export default useLeaderboardData;

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

  // Memoize the profile addresses to prevent infinite re-renders
  const profileAddresses = useMemo(() => {
    return leaderboard?.users ?? [];
  }, [leaderboard?.users]);

  const { data: profiles } = api.profile.getManyByAddress.useQuery(
    {
      chainId: DEFAULT_CHAIN.id,
      addresses: profileAddresses,
    },
    {
      enabled: !!leaderboard?.users && profileAddresses.length > 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  return { leaderboard, profiles };
};

export default useLeaderboardData;

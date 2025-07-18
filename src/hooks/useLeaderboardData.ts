import { DEFAULT_CHAIN } from "~/constants";
import { api } from "~/utils/api";

export type UseLeaderboardOptions = {
  startDate?: Date;
  endDate?: Date;
};

export const useLeaderboardData = ({
  startDate,
  endDate,
}: UseLeaderboardOptions) => {
  console.log("🎯 useLeaderboardData hook called", { startDate, endDate });
  
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
      onSuccess: (data) => {
        console.log("🎯 useLeaderboardData leaderboard query success", data);
      },
      onError: (error) => {
        console.log("🎯 useLeaderboardData leaderboard query error", error);
      },
    },
  );

  const { data: profiles } = api.profile.getManyByAddress.useQuery(
    {
      chainId: DEFAULT_CHAIN.id,
      addresses: [...(leaderboard?.users ?? [])],
    },
    {
      enabled: !!leaderboard?.users,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      onSuccess: (data) => {
        console.log("🎯 useLeaderboardData profiles query success", data);
      },
      onError: (error) => {
        console.log("🎯 useLeaderboardData profiles query error", error);
      },
    },
  );

  console.log("🎯 useLeaderboardData returning", { 
    leaderboard: !!leaderboard, 
    profiles: !!profiles,
    usersCount: leaderboard?.users?.length ?? 0
  });

  return { leaderboard, profiles };
};

export default useLeaderboardData;

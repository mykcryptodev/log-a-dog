import { useContext } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";

export type UseLeaderboardOptions = {
  startDate?: Date;
  endDate?: Date;
};

export const useLeaderboardData = ({
  startDate,
  endDate,
}: UseLeaderboardOptions) => {
  const { activeChain } = useContext(ActiveChainContext);

  const { data: leaderboard, refetch } = api.hotdog.getLeaderboard.useQuery(
    {
      chainId: activeChain.id,
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


  const { data: profiles } = api.profile.getManyByAddress.useQuery(
    {
      chainId: activeChain.id,
      addresses: [...(leaderboard?.users ?? [])],
    },
    {
      enabled: !!leaderboard?.users,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  return { leaderboard, profiles };
};

export default useLeaderboardData;

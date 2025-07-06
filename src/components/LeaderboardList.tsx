import { type FC } from "react";
import Link from "next/link";
import { Avatar } from "./Profile/Avatar";
import { Name } from "./Profile/Name";
import useLeaderboardData from "~/hooks/useLeaderboardData";
import { useSession } from "next-auth/react";

export type LeaderboardListProps = {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp?: number;
  showCurrentUser?: boolean;
  height?: string;
};

export const LeaderboardList: FC<LeaderboardListProps> = ({
  limit = 10,
  startDate,
  endDate,
  refetchTimestamp = 0,
  showCurrentUser = false,
  height = "400px",
}) => {
  const { data: session } = useSession();
  const { leaderboard, profiles } = useLeaderboardData({
    startDate,
    endDate,
    refetchTimestamp,
  });

  if (!leaderboard || !profiles)
    return <div className="w-full rounded-lg bg-base-200" style={{ height }} />;

  const addresses = leaderboard.users ?? [];
  const hotdogs = leaderboard.hotdogs ?? [];

  const displayUsers = addresses.slice(0, limit);
  const displayHotdogs = hotdogs.slice(0, limit);

  let currentUserRow: {
    address: string;
    rank: number;
    hotdogs: number;
  } | null = null;

  if (showCurrentUser && session?.user?.address) {
    const addrLower = session.user.address.toLowerCase();
    const index = addresses.findIndex((a) => a.toLowerCase() === addrLower);
    if (index >= 0) {
      currentUserRow = {
        address: addresses[index]!,
        rank: index + 1,
        hotdogs: Number(hotdogs[index]!),
      };
      if (index < limit) {
        displayUsers.splice(index, 1);
        displayHotdogs.splice(index, 1);
      }
    }
  }

  return (
    <div
      className="w-full space-y-2 overflow-y-auto rounded-lg bg-base-200 bg-opacity-25 p-4 backdrop-blur-sm"
      style={{ maxHeight: height }}
    >
      {currentUserRow && (
        <div className="flex items-center justify-between rounded-lg bg-base-200 bg-opacity-50 p-3">
          <Link
            href={`/profile/address/${currentUserRow.address}`}
            className="flex items-center gap-3"
          >
            <div className="text-lg font-bold text-secondary">
              #{currentUserRow.rank}
            </div>
            <Avatar size="32px" address={currentUserRow.address} />
            <div className="font-medium">
              <Name address={currentUserRow.address} noLink />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{currentUserRow.hotdogs}</span>
            <span className="text-sm text-base-content/70">hotdogs</span>
          </div>
        </div>
      )}
      {displayUsers.map((address, idx) => {
        const hotdogCount = Number(displayHotdogs[idx]);
        const rank = addresses.indexOf(address) + 1;
        return (
          <div
            key={address}
            className="flex items-center justify-between gap-2 rounded-lg bg-base-200 bg-opacity-50 p-3 transition-colors hover:bg-base-300"
          >
            <Link
              href={`/profile/address/${address}`}
              className="flex items-center gap-3"
            >
              <div className="text-lg font-bold text-secondary">#{rank}</div>
              <Avatar size="32px" address={address} />
              <div className="font-medium">
                <Name address={address} noLink />
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{hotdogCount}</span>
              <span className="text-sm text-base-content/70">hotdogs</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaderboardList;

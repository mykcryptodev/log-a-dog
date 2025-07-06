import { type FC } from "react";
import Link from "next/link";
import { Name } from "./Profile/Name";
import { Avatar } from "./Profile/Avatar";
import styles from "./LeaderboardBanner.module.css";
import useLeaderboardData from "~/hooks/useLeaderboardData";

type Props = {
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp: number;
  scrollSpeed?: number; // pixels per second
};

export const LeaderboardBanner: FC<Props> = ({
  startDate,
  endDate,
  refetchTimestamp,
  scrollSpeed = 50,
}) => {
  const { leaderboard, profiles } = useLeaderboardData({
    startDate,
    endDate,
    refetchTimestamp,
  });

  if (!leaderboard || !profiles)
    return <div className="h-20 w-full rounded-lg bg-base-200" />;

  const users = leaderboard.users ?? [];
  const hotdogs = leaderboard.hotdogs ?? [];

  // Calculate animation duration based on content width and scroll speed
  const itemWidth = 200; // approximate width per item
  const totalWidth = users.length * itemWidth;
  const animationDuration = totalWidth / scrollSpeed;

  return (
    <div className="w-full overflow-hidden bg-base-200 bg-opacity-25 backdrop-blur-sm">
      <div className="relative h-14 overflow-hidden py-2">
        <div
          className={`absolute flex items-center gap-6 whitespace-nowrap ${styles.scrollContainer}`}
          style={
            {
              "--duration": `${animationDuration}s`,
              width: `${totalWidth * 2}px`, // Double width for seamless loop
            } as React.CSSProperties
          }
        >
          {/* First set of items */}
          {users.map((address, index) => {
            const hotdogCount = Number(hotdogs[index]);

            return (
              <Link
                key={`first-${address}`}
                href={`/profile/address/${address}`}
                className="flex min-w-fit items-center gap-2 rounded-full bg-base-100 bg-opacity-50 px-4 py-2 transition-colors hover:bg-base-300"
              >
                <div className="text-sm font-bold text-secondary">
                  #{index + 1}
                </div>
                <Avatar size="24px" address={address} />
                <div className="text-sm font-medium">
                  <Name address={address} noLink />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{hotdogCount}</span>
                  <span className="text-xs text-base-content/70">🌭</span>
                </div>
              </Link>
            );
          })}

          {/* Duplicate set for seamless loop */}
          {users.map((address, index) => {
            const hotdogCount = Number(hotdogs[index]);
            return (
              <Link
                key={`second-${address}`}
                href={`/profile/address/${address}`}
                className="flex min-w-fit items-center gap-2 rounded-full bg-base-100 bg-opacity-50 px-4 py-2 transition-colors hover:bg-base-300"
              >
                <div className="text-sm font-bold text-secondary">
                  #{index + 1}
                </div>
                <Avatar size="24px" address={address} />
                <div className="text-sm font-medium">
                  <Name address={address} noLink />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{hotdogCount}</span>
                  <span className="text-xs text-base-content/70">🌭</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

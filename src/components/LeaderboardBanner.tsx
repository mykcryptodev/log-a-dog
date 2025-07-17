import { type FC, useEffect, useState, useMemo } from "react";
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
  const [reduceMotion, setReduceMotion] = useState(false);
  
  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);
  
  const { leaderboard, profiles } = useLeaderboardData({
    startDate,
    endDate,
    refetchTimestamp,
  });

  if (!leaderboard || !profiles)
    return <div className="h-20 w-full rounded-lg bg-base-200" />;

  const users = leaderboard.users ?? [];
  const hotdogs = leaderboard.hotdogs ?? [];

  // On mobile or with reduced motion, show a static banner with top 5
  if (reduceMotion) {
    const topUsers = users.slice(0, 5);
    const topHotdogs = hotdogs.slice(0, 5);
    
    return (
      <div className="w-full overflow-x-auto bg-base-200 bg-opacity-25 backdrop-blur-sm">
        <div className="flex items-center gap-4 whitespace-nowrap p-2">
          {topUsers.map((address, index) => {
            const hotdogCount = Number(topHotdogs[index]);
            return (
              <Link
                key={address}
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
    );
  }

  // Calculate animation duration based on content width and scroll speed
  const itemWidth = 200; // approximate width per item
  const totalWidth = users.length * itemWidth;
  const animationDuration = totalWidth / scrollSpeed;

  // Memoize the style object to prevent re-creation on every render
  const scrollContainerStyle = useMemo(() => ({
    "--duration": `${animationDuration}s`,
    width: `${totalWidth * 2}px`, // Double width for seamless loop
  } as React.CSSProperties), [animationDuration, totalWidth]);

  return (
    <div className="w-full overflow-hidden bg-base-200 bg-opacity-25 backdrop-blur-sm">
      <div className="relative h-14 overflow-hidden py-2">
        <div
          className={`absolute flex items-center gap-6 whitespace-nowrap ${styles.scrollContainer}`}
          style={scrollContainerStyle}
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

export default LeaderboardBanner;

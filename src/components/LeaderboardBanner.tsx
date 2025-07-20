import { type FC, useMemo, memo } from "react";
import { Badge } from "./Profile/Badge";
import Link from "next/link";
import styles from "./LeaderboardBanner.module.css";
import useLeaderboardData from "~/hooks/useLeaderboardData";
import usePrefersReducedMotion from "~/hooks/usePrefersReducedMotion";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { getProxiedUrl } from "~/utils/imageProxy";

type Props = {
  startDate?: Date;
  endDate?: Date;
  scrollSpeed?: number; // pixels per second
};

const LeaderboardBannerComponent: FC<Props> = ({
  startDate,
  endDate,
  scrollSpeed = 50,
  }) => {
    const reduceMotion = usePrefersReducedMotion();

  const { leaderboard, profiles } = useLeaderboardData({
    startDate,
    endDate,
  });

  const users = useMemo(() => {
    return leaderboard?.users ?? [];
  }, [leaderboard?.users]);

  const hotdogs = useMemo(() => {
    return leaderboard?.hotdogs ?? [];
  }, [leaderboard?.hotdogs]);

  if (!leaderboard || !profiles)
    return (
      <div className="h-20 w-full rounded-lg bg-base-200" />
    );

  // On mobile or with reduced motion, show a static banner with top 5
  if (reduceMotion) {
    const topUsers = users.slice(0, 5);
    const topHotdogs = hotdogs.slice(0, 5);

    return (
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-4 whitespace-nowrap p-2">
          {topUsers.map((address, index) => {
            const hotdogCount = Number(topHotdogs[index]);
            const profile = profiles[index];
            const displayName = profile?.name ?? profile?.username ?? `${address.slice(0, 6)}...${address.slice(-4)}`;
            const avatarUrl = profile?.image;
            
            return (
              <Link
                key={address}
                href={`/profile/address/${address}`}
                className="flex min-w-fit items-center gap-2 rounded-full bg-base-100 bg-opacity-50 px-4 py-2 transition-colors hover:bg-base-300"
              >
                <div className="text-sm font-bold text-secondary">
                  #{index + 1}
                </div>
                {avatarUrl && avatarUrl !== "" ? (
                  <img
                    src={getProxiedUrl(avatarUrl)}
                    alt={displayName}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="mt-0.5">
                    <Jazzicon
                      diameter={16}
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                      seed={jsNumberForAddress(address)}
                    />
                  </div>
                )}
                <div className="text-sm font-medium">
                  {displayName}
                </div>
                <Badge 
                  address={address}
                  fid={profile?.fid}
                  isKnownSpammer={profile?.isKnownSpammer}
                  isReportedForSpam={profile?.isReportedForSpam}
                />
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
  
  // Limit to top 10 users to prevent browser crashes
  const topUsers = users.slice(0, 10);
  const topHotdogs = hotdogs.slice(0, 10);
  
  const totalWidth = topUsers.length * itemWidth;
  const animationDuration = totalWidth / scrollSpeed;

  return (
    <div className="w-full overflow-hidden">
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
          {topUsers.map((address, index) => {
            const hotdogCount = Number(topHotdogs[index]);
            const profile = profiles[index];
            const displayName = profile?.name ?? profile?.username ?? `${address.slice(0, 6)}...${address.slice(-4)}`;
            const avatarUrl = profile?.image;

            return (
              <Link
                key={`first-${address}`}
                href={`/profile/address/${address}`}
                className="flex min-w-fit items-center gap-2 rounded-full bg-base-100 bg-opacity-50 px-4 py-2 transition-colors hover:bg-base-300"
              >
                <div className="text-sm font-bold text-secondary">
                  #{index + 1}
                </div>
                {avatarUrl && avatarUrl !== "" ? (
                  <img
                    src={getProxiedUrl(avatarUrl)}
                    alt={displayName}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="mt-0.5">
                    <Jazzicon
                      diameter={16}
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                      seed={jsNumberForAddress(address)}
                    />
                  </div>
                )}
                <div className="text-sm font-medium">
                  {displayName}
                </div>
                <Badge 
                  address={address}
                  fid={profile?.fid}
                  isKnownSpammer={profile?.isKnownSpammer}
                  isReportedForSpam={profile?.isReportedForSpam}
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{hotdogCount}</span>
                  <span className="text-xs text-base-content/70">🌭</span>
                </div>
              </Link>
            );
          })}

          {/* Duplicate set for seamless loop */}
          {topUsers.map((address, index) => {
            const hotdogCount = Number(topHotdogs[index]);
            const profile = profiles[index];
            const displayName = profile?.name ?? profile?.username ?? `${address.slice(0, 6)}...${address.slice(-4)}`;
            const avatarUrl = profile?.image;

            return (
              <Link
                key={`second-${address}`}
                href={`/profile/address/${address}`}
                className="flex min-w-fit items-center gap-2 rounded-full bg-base-100 bg-opacity-50 px-4 py-2 transition-colors hover:bg-base-300"
              >
                <div className="text-sm font-bold text-secondary">
                  #{index + 1}
                </div>
                {avatarUrl && avatarUrl !== "" ? (
                  <img
                    src={getProxiedUrl(avatarUrl)}
                    alt={displayName}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="mt-0.5">
                    <Jazzicon
                      diameter={16}
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                      seed={jsNumberForAddress(address)}
                    />
                  </div>
                )}
                <div className="text-sm font-medium">
                  {displayName}
                </div>
                <Badge 
                  address={address}
                  fid={profile?.fid}
                  isKnownSpammer={profile?.isKnownSpammer}
                  isReportedForSpam={profile?.isReportedForSpam}
                />
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

export const LeaderboardBanner = memo(LeaderboardBannerComponent);
export default LeaderboardBanner;

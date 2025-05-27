import { useContext, type FC, useEffect } from "react";
import { api } from "~/utils/api";
import ActiveChainContext from "~/contexts/ActiveChain";
import Link from "next/link";
import { Name } from "./Profile/Name";
import { Avatar } from "./Profile/Avatar";
import styles from "./LeaderboardBanner.module.css";

type Props = {
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp: number;
  scrollSpeed?: number; // pixels per second
}

export const LeaderboardBanner: FC<Props> = ({ 
  startDate, 
  endDate, 
  refetchTimestamp, 
  scrollSpeed = 50 
}) => {
  const { activeChain } = useContext(ActiveChainContext);

  const { data: leaderboard, refetch } = api.hotdog.getLeaderboard.useQuery({
    chainId: activeChain.id,
    ...startDate && { startDate: Math.floor(startDate.getTime() / 1000) },
    ...endDate && { endDate: Math.floor(endDate.getTime() / 1000) },
  }, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (refetchTimestamp) {
      void refetch();
    }
  }, [refetch, refetchTimestamp]);

  const { data: profiles } = api.profile.getManyByAddress.useQuery({
    chainId: activeChain.id,
    addresses: [...(leaderboard?.users ?? [])],
  }, {
    enabled: !!leaderboard?.users,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (!leaderboard || !profiles) return (
    <div className="bg-base-200 rounded-lg animate-pulse w-full h-20" />
  );

  const users = leaderboard.users ?? [];
  const hotdogs = leaderboard.hotdogs ?? [];

  // Calculate animation duration based on content width and scroll speed
  const itemWidth = 200; // approximate width per item
  const totalWidth = users.length * itemWidth;
  const animationDuration = totalWidth / scrollSpeed;

  return (
    <div className="w-full bg-base-200 bg-opacity-25 backdrop-blur-sm shadow overflow-hidden">
      <div className="relative overflow-hidden h-14 py-2">
        <div 
          className={`flex items-center gap-6 absolute whitespace-nowrap ${styles.scrollContainer}`}
          style={{
            '--duration': `${animationDuration}s`,
            width: `${totalWidth * 2}px`, // Double width for seamless loop
          } as React.CSSProperties}
        >
          {/* First set of items */}
          {users.map((address, index) => {
            const hotdogCount = Number(hotdogs[index]);
            
            return (
              <Link 
                key={`first-${address}`}
                href={`/profile/address/${address}`} 
                className="flex items-center gap-2 px-4 py-2 bg-base-100 bg-opacity-50 rounded-full hover:bg-base-300 transition-colors min-w-fit"
              >
                <div className="text-sm font-bold text-secondary">#{index + 1}</div>
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
                className="flex items-center gap-2 px-4 py-2 bg-base-100 bg-opacity-50 rounded-full hover:bg-base-300 transition-colors min-w-fit"
              >
                <div className="text-sm font-bold text-secondary">#{index + 1}</div>
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
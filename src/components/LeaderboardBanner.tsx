import { type FC, useMemo, memo } from "react";
import { Badge } from "./Profile/Badge";
import Link from "next/link";
import styles from "./LeaderboardBanner.module.css";
import useLeaderboardData from "~/hooks/useLeaderboardData";
import usePrefersReducedMotion from "~/hooks/usePrefersReducedMotion";
import { Blobbie } from "thirdweb/react";
import { getProxiedUrl } from "~/utils/imageProxy";
import Image from "next/image";

type Props = {
  startDate?: Date;
  endDate?: Date;
  scrollSpeed?: number;
};

type TickerItem = {
  address: string;
  hotdogCount: number;
  rank: number;
  name: string;
  avatarUrl?: string | null;
  profile?: {
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
    isDisqualified?: boolean | null;
  };
};

const TickerPill: FC<{ item: TickerItem }> = ({ item }) => (
  <Link
    href={`/profile/address/${item.address}`}
    className="flex min-w-fit shrink-0 items-center gap-2 rounded-full border border-base-content/10 bg-base-200/60 px-3 py-1.5 text-sm transition-colors hover:bg-base-300"
  >
    <span className="font-display tabular-nums text-secondary">{item.rank}</span>
    {item.avatarUrl ? (
      <Image
        src={getProxiedUrl(item.avatarUrl)}
        alt={item.name}
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover"
      />
    ) : (
      <Blobbie address={item.address} size={20} className="shrink-0 rounded-full" />
    )}
    <span className="font-medium">{item.name}</span>
    <Badge
      address={item.address}
      fid={item.profile?.fid}
      isKnownSpammer={item.profile?.isKnownSpammer}
      isReportedForSpam={item.profile?.isReportedForSpam}
      isDisqualified={item.profile?.isDisqualified}
    />
    <span className="font-display font-bold tabular-nums text-primary">{item.hotdogCount}🌭</span>
  </Link>
);

const LiveBadge: FC<{ dim?: boolean }> = ({ dim }) => (
  <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-base-content/10 bg-base-100/80 px-3 backdrop-blur-sm">
    <span className={`h-1.5 w-1.5 rounded-full bg-secondary ${dim ? "opacity-30" : "animate-pulse"}`} />
    <span className={`font-display text-xs tracking-wider text-secondary ${dim ? "opacity-30" : ""}`}>
      LIVE
    </span>
  </div>
);

const LeaderboardBannerComponent: FC<Props> = ({
  startDate,
  endDate,
  scrollSpeed = 45,
}) => {
  const reduceMotion = usePrefersReducedMotion();
  const { leaderboard, profiles } = useLeaderboardData({ startDate, endDate });

  const items = useMemo<TickerItem[]>(() => {
    const users = leaderboard?.users?.slice(0, 10) ?? [];
    const hotdogs = leaderboard?.hotdogs ?? [];
    return users.map((address, i) => {
      const profile = profiles?.[i];
      return {
        address,
        hotdogCount: Number(hotdogs[i] ?? 0),
        rank: i + 1,
        name: profile?.name ?? profile?.username ?? `${address.slice(0, 6)}…${address.slice(-4)}`,
        avatarUrl: profile?.image,
        profile: {
          fid: profile?.fid,
          isKnownSpammer: profile?.isKnownSpammer,
          isReportedForSpam: profile?.isReportedForSpam,
          isDisqualified: profile?.isDisqualified,
        },
      };
    });
  }, [leaderboard, profiles]);

  if (!leaderboard || !profiles) {
    return (
      <div className="flex h-12 items-stretch overflow-hidden">
        <LiveBadge dim />
        <div className="grill-skeleton flex-1 animate-grill-shimmer" />
      </div>
    );
  }

  if (items.length === 0) return null;

  if (reduceMotion) {
    return (
      <div className="flex h-12 items-stretch overflow-hidden">
        <LiveBadge />
        <div className="flex flex-1 items-center gap-3 overflow-x-auto px-3">
          {items.map((item) => (
            <TickerPill key={item.address} item={item} />
          ))}
        </div>
      </div>
    );
  }

  const itemWidth = 180;
  const totalWidth = items.length * itemWidth;
  const animationDuration = totalWidth / scrollSpeed;

  return (
    <div className="flex h-12 items-stretch overflow-hidden">
      <LiveBadge />
      <div className="relative flex-1 overflow-hidden">
        <div
          className={`absolute flex h-full items-center gap-3 whitespace-nowrap px-3 ${styles.scrollContainer}`}
          style={
            {
              "--duration": `${animationDuration}s`,
              width: `${totalWidth * 2 + 24}px`,
            } as React.CSSProperties
          }
        >
          {items.map((item) => (
            <TickerPill key={`a-${item.address}`} item={item} />
          ))}
          {items.map((item) => (
            <TickerPill key={`b-${item.address}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const LeaderboardBanner = memo(LeaderboardBannerComponent);
export default LeaderboardBanner;

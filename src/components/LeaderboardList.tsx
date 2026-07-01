import { type FC, memo, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import useLeaderboardData from "~/hooks/useLeaderboardData";
import { useSession } from "next-auth/react";
import { Blobbie } from "thirdweb/react";
import { getProxiedUrl } from "~/utils/imageProxy";
import Image from "next/image";

export type LeaderboardListProps = {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  showCurrentUser?: boolean;
  height?: string;
  /** Show top-3 podium treatment above the list. */
  showPodium?: boolean;
};

type ProfileData = {
  address: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  fid?: number | null;
  isKnownSpammer?: boolean | null;
  isReportedForSpam?: boolean | null;
  isDisqualified?: boolean | null;
};

const nameFor = (p: ProfileData | undefined, address: string) =>
  p?.name ?? p?.username ?? `${address.slice(0, 6)}...${address.slice(-4)}`;

// Module-scope so it keeps a stable identity across renders
// (see React rule rerender-no-inline-components).
const LbAvatar: FC<{ profile?: ProfileData; address: string; size: number }> = ({
  profile,
  address,
  size,
}) => {
  const avatarUrl = profile?.image;
  if (avatarUrl && avatarUrl !== "") {
    return (
      <Image
        src={getProxiedUrl(avatarUrl)}
        alt={nameFor(profile, address)}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Blobbie address={address} size={size} className="shrink-0 rounded-full" />
  );
};

const PODIUM_STYLE = [
  { ring: "ring-primary", glow: "shadow-dog-lg", medal: "🥇", order: "order-2" },
  { ring: "ring-base-content/30", glow: "shadow-dog", medal: "🥈", order: "order-1" },
  { ring: "ring-secondary/60", glow: "shadow-dog", medal: "🥉", order: "order-3" },
];

const LeaderboardListComponent: FC<LeaderboardListProps> = ({
  limit = 10,
  startDate,
  endDate,
  showCurrentUser = false,
  height = "400px",
  showPodium = false,
}) => {
  const { data: session } = useSession();
  const { leaderboard, profiles } = useLeaderboardData({ startDate, endDate });

  const profileMap = useMemo(() => {
    if (!leaderboard?.users || !profiles) return new Map<string, ProfileData>();
    const map = new Map<string, ProfileData>();
    leaderboard.users.forEach((address, index) => {
      const profile = profiles[index];
      if (profile) map.set(address.toLowerCase(), profile as ProfileData);
    });
    return map;
  }, [leaderboard?.users, profiles]);

  if (!leaderboard || !profiles)
    return <div className="pop-card grill-skeleton w-full animate-grill-shimmer rounded-2xl" style={{ height }} />;

  const addresses = leaderboard.users ?? [];
  const hotdogs = leaderboard.hotdogs ?? [];

  const podium = showPodium ? addresses.slice(0, 3) : [];
  const listStartIdx = showPodium ? 3 : 0;

  const displayUsers = addresses.slice(listStartIdx, limit);
  const displayHotdogs = hotdogs.slice(listStartIdx, limit);

  let currentUserRow: { address: string; rank: number; hotdogs: number } | null = null;
  if (showCurrentUser && session?.user?.address) {
    const addrLower = session.user.address.toLowerCase();
    const index = addresses.findIndex((a) => a.toLowerCase() === addrLower);
    if (index >= 0) {
      currentUserRow = {
        address: addresses[index]!,
        rank: index + 1,
        hotdogs: Number(hotdogs[index]!),
      };
      const localIdx = displayUsers.indexOf(addresses[index]!);
      if (localIdx >= 0) {
        displayUsers.splice(localIdx, 1);
        displayHotdogs.splice(localIdx, 1);
      }
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Podium — top 3, #1 raised with a mustard glow */}
      {showPodium && podium.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-2">
          {podium.map((address, i) => {
            const profile = profileMap.get(address.toLowerCase());
            const count = Number(hotdogs[i]);
            const style = PODIUM_STYLE[i]!;
            const isFirst = i === 0;
            return (
              <Link
                key={address}
                href={`/profile/address/${address}`}
                className={`${style.order} pop-card flex flex-col items-center gap-1 rounded-3xl p-3 ${
                  isFirst ? "bg-primary pb-6 text-primary-content" : "bg-base-200"
                }`}
              >
                <span className="text-2xl">{style.medal}</span>
                <div className="pop-frame overflow-hidden rounded-full">
                  <LbAvatar profile={profile} address={address} size={isFirst ? 64 : 48} />
                </div>
                <span className="max-w-full truncate text-xs font-semibold">
                  {nameFor(profile, address)}
                </span>
                <span className="font-display text-2xl tabular-nums leading-none">
                  {count} 🌭
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div
        className="pop-card w-full space-y-2 overflow-y-auto rounded-2xl bg-base-100 p-3"
        style={{ maxHeight: height }}
      >
        {currentUserRow && (
          <motion.div
            layout
            className="flex items-center justify-between gap-2 rounded-xl border-2 border-base-content bg-primary/25 p-3"
          >
            <Link href={`/profile/address/${currentUserRow.address}`} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-base-content bg-primary font-display text-base tabular-nums text-primary-content">
                {currentUserRow.rank}
              </span>
              <LbAvatar profile={profileMap.get(currentUserRow.address.toLowerCase())} address={currentUserRow.address} size={28} />
              <span className="font-semibold">
                {nameFor(profileMap.get(currentUserRow.address.toLowerCase()), currentUserRow.address)}
                <span className="ml-1 text-xs opacity-60">(you)</span>
              </span>
            </Link>
            <span className="font-display text-2xl tabular-nums">{currentUserRow.hotdogs} 🌭</span>
          </motion.div>
        )}

        {displayUsers.map((address, idx) => {
          const hotdogCount = Number(displayHotdogs[idx]);
          const rank = addresses.indexOf(address) + 1;
          const profile = profileMap.get(address.toLowerCase());
          return (
            <motion.div
              key={address}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className="flex items-center justify-between gap-2 rounded-xl border-2 border-base-content bg-base-100 p-3 transition-colors hover:bg-base-200"
            >
              <Link href={`/profile/address/${address}`} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-base-content bg-base-200 font-display text-base tabular-nums text-secondary">
                  {rank}
                </span>
                <LbAvatar profile={profile} address={address} size={28} />
                <span className="font-semibold">{nameFor(profile, address)}</span>
              </Link>
              <span className="font-display text-2xl tabular-nums">{hotdogCount} 🌭</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const LeaderboardList = memo(LeaderboardListComponent);
export default LeaderboardList;

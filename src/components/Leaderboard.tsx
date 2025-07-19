import {
  memo,
  type FC,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { Avatar } from "./Profile/Avatar";
import useLeaderboardData from "~/hooks/useLeaderboardData";

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
};

const LeaderboardComponent: FC<Props> = ({ limit, startDate, endDate }) => {
  const limitOrDefault = limit ?? 10;
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const { leaderboard, profiles } = useLeaderboardData({
    startDate,
    endDate,
  });

  const hasNextPage = leaderboard?.users
    ? leaderboard.users.length > (page + 1) * limitOrDefault
    : false;
  const displayedUsers = useMemo(
    () => leaderboard?.users?.slice(0, (page + 1) * limitOrDefault) ?? [],
    [leaderboard?.users, page, limitOrDefault],
  );
  const displayedHotdogs = useMemo(
    () => leaderboard?.hotdogs?.slice(0, (page + 1) * limitOrDefault) ?? [],
    [leaderboard?.hotdogs, page, limitOrDefault],
  );

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasNextPage],
  );

  if (!leaderboard || !profiles)
    return <div className="h-72 w-[640px] rounded-lg bg-base-200" />;

  const filteredUsers = displayedUsers.filter((address, index) => {
    const profile = profiles[index];
    const searchLower = searchQuery.toLowerCase();
    return (
      (profile?.username?.toLowerCase().includes(searchLower) ?? false) ||
      (profile?.name?.toLowerCase().includes(searchLower) ?? false) ||
      address.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="card w-full max-w-2xl bg-base-200 bg-opacity-25 p-4 backdrop-blur-sm">
      <div className="relative mb-4 flex items-center">
        <div className="absolute right-0">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
        <div className="mx-auto text-2xl font-bold">🌭 Leaderboard</div>
      </div>
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by username or address..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      <div className="w-lg max-h-[500px] space-y-2 overflow-y-auto pr-2">
        {filteredUsers.map((address, index) => {
          const originalIndex = displayedUsers.indexOf(address);
          const hotdogCount = Number(displayedHotdogs[originalIndex]);
          const isLastElement = index === filteredUsers.length - 1;
          const profile = profiles[originalIndex];
          const displayName = profile?.name ?? profile?.username ?? `${address.slice(0, 6)}...${address.slice(-4)}`;

          return (
            <div
              key={address}
              ref={isLastElement ? lastElementRef : null}
              className="flex items-center justify-between gap-2 rounded-lg bg-base-200 bg-opacity-50 p-3 transition-colors hover:bg-base-300"
            >
              <Link
                href={`/profile/address/${address}`}
                className="flex items-center gap-3"
              >
                <div className="text-lg font-bold text-secondary">
                  {originalIndex + 1}
                </div>
                <Avatar size="32px" address={address} />
                <div className="font-medium">
                  {displayName}
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{hotdogCount}</span>
                <span className="text-sm text-base-content/70">hotdogs</span>
              </div>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="py-4 text-center text-base-content/70">
            No results found
          </div>
        )}
      </div>
    </div>
  );
};
export const Leaderboard = memo(LeaderboardComponent);

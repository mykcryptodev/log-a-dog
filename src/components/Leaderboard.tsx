import { useContext, type FC, useState, useEffect, useRef, useCallback } from "react";
import { api } from "~/utils/api";
import ActiveChainContext from "~/contexts/ActiveChain";
import { resolveScheme } from "thirdweb/storage";
import { client } from "~/providers/Thirdweb";
import Image from "next/image";
import Link from "next/link";

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  refetchTimestamp: number;
}

export const Leaderboard: FC<Props> = ({ attestors, limit, startDate, endDate, refetchTimestamp }) => {
  const limitOrDefault = limit ?? 10;
  const { activeChain } = useContext(ActiveChainContext);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

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

  const hasNextPage = leaderboard?.users ? leaderboard.users.length > (page + 1) * limitOrDefault : false;
  const displayedUsers = leaderboard?.users?.slice(0, (page + 1) * limitOrDefault) ?? [];
  const displayedHotdogs = leaderboard?.hotdogs?.slice(0, (page + 1) * limitOrDefault) ?? [];

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasNextPage) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [hasNextPage]);

  if (!leaderboard || !profiles) return (
    <div className="bg-base-200 rounded-lg animate-pulse w-[640px] h-72" />
  );

  const filteredUsers = displayedUsers.filter((address, index) => {
    const profile = profiles.find(p => p.address === address);
    const searchLower = searchQuery.toLowerCase();
    return (
      (profile?.username?.toLowerCase().includes(searchLower) ?? false) ||
      address.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-full max-w-2xl card bg-base-200 bg-opacity-25 backdrop-blur-sm shadow p-4">
      <div className="flex items-center mb-4 relative">
        <div className="absolute right-0">
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <div className="text-2xl font-bold mx-auto">🌭 Leaderboard</div>
      </div>
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by username or address..."
            className="w-full input input-bordered"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-2 max-h-[500px] w-lg overflow-y-auto pr-2">
        {filteredUsers.map((address, index) => {
          const profile = profiles.find(p => p.address === address);
          const originalIndex = displayedUsers.indexOf(address);
          const hotdogCount = Number(displayedHotdogs[originalIndex]);
          const isLastElement = index === filteredUsers.length - 1;

          return (
            <div
              key={address}
              ref={isLastElement ? lastElementRef : null}
              className="flex items-center justify-between p-3 bg-base-200 bg-opacity-50 rounded-lg hover:bg-base-300 transition-colors gap-2"
            >
              <Link href={`/profile/address/${address}`} className="flex items-center gap-3">
                <div className="text-lg font-bold text-secondary">{originalIndex + 1}</div>
                {profile?.imgUrl ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={resolveScheme({ client, uri: profile.imgUrl })}
                      alt={profile.username ?? "Profile"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-base-300" />
                )}
                <div className="font-medium">
                  {profile?.username ?? `${address.slice(0, 6)}...${address.slice(-4)}`}
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
          <div className="text-center py-4 text-base-content/70">
            No results found
          </div>
        )}
      </div>
    </div>
  );
};
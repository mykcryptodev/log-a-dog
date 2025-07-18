import Link from "next/link";
import { useSession } from "next-auth/react";
import { type FC } from "react";
import Image from "next/image";
import { HOTDOG_TOKEN, DEFAULT_CHAIN } from "~/constants";
import { api } from "~/utils/api";

const RelevantHolders: FC = () => {
  const { data: session } = useSession();
  const fid = session?.user?.fid;

  const { data, isLoading } = api.warpcast.getRelevantHolders.useQuery(
    {
      contractAddress: HOTDOG_TOKEN[DEFAULT_CHAIN.id]!,
      network: "base",
      viewerFid: fid ?? 0,
    },
    {
      enabled: !!fid,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  if (!fid) return null;

  if (isLoading)
    return (
      <div className="h-20 w-full max-w-md animate-pulse rounded-lg bg-base-200" />
    );

  const holders = data?.top_relevant_fungible_owners_hydrated ?? [];

  if (holders.length === 0) return null;

  const maxAvatars = 6;
  const visibleHolders = holders.slice(0, maxAvatars);
  const remainingCount = holders.length - maxAvatars;

  return (
    <div className="w-full max-w-md">
      <div className="avatar-group -space-x-6 rtl:space-x-reverse justify-center">
        {visibleHolders.map((holder) => (
          <Link
            key={holder.fid}
            href={`/profile/address/${holder.custody_address}`}
            className="avatar hover:z-10 transition-transform hover:scale-110"
          >
            <div className="w-10">
              <Image src={holder.pfp_url} alt={holder.username} width={48} height={48} />
            </div>
          </Link>
        ))}
        {remainingCount > 0 && (
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content w-10">
              <span className="text-xs">+{remainingCount}</span>
            </div>
          </div>
        )}
      </div>
      <h2 className="mt-2 text-center text-xs opacity-75">
        your friends have $HOTDOG!
      </h2>
    </div>
  );
};

export default RelevantHolders;

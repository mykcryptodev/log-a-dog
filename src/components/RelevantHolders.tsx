import Link from "next/link";
import { useSession } from "next-auth/react";
import { type FC } from "react";
import { Avatar } from "~/components/Profile/Avatar";
import { Name } from "~/components/Profile/Name";
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

  return (
    <div className="w-full max-w-md">
      <h2 className="mb-2 text-center text-2xl font-bold">
        Friends holding $HOTDOG
      </h2>
      <div className="space-y-2">
        {holders.map((holder) => (
          <Link
            key={holder.fid}
            href={`/profile/address/${holder.custody_address}`}
            className="flex items-center gap-3 rounded-lg bg-base-200 bg-opacity-50 p-3 transition-colors hover:bg-base-300"
          >
            <Avatar size="32px" address={holder.custody_address} />
            <div className="font-medium">
              <Name address={holder.custody_address} noLink />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelevantHolders;

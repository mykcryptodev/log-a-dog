import Link from "next/link";
import { type FC, memo } from "react";
import { api } from "~/utils/api";
import { ProfileButton } from "./Button";
import { DEFAULT_CHAIN } from "~/constants";
import { Badge } from "./Badge";
import { useStableAccount } from "~/hooks/useStableAccount";

const NameComponent: FC<{ address: string; noLink?: boolean }> = ({ address, noLink }) => {
  const account = useStableAccount();
  const accountAddress = account?.address?.toLowerCase();
  const { data: profile, isLoading } = api.profile.getByAddress.useQuery({
    chainId: DEFAULT_CHAIN.id,
    address,
    }, {
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: userData } = api.user.getByAddress.useQuery({
    address: address.toLowerCase(),
  }, {
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading) {
    return (
      <div className="w-32 h-6 bg-base-200 rounded-full animate-pulse" />
    );
  }

  if (profile?.username === "" && accountAddress === address.toLowerCase()) {
    return (
      <ProfileButton hideLogout />
    );
  }

  if (profile?.username === "") {
    return (
      <div className="flex items-center gap-1">
        <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
        <Badge className="z-10" isKnownSpammer={userData?.isKnownSpammer ?? false} isReportedForSpam={userData?.isReportedForSpam ?? false} fid={userData?.fid ?? undefined} address={address} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-1">
        <span>Unknown</span>
        <Badge className="z-10" isKnownSpammer={userData?.isKnownSpammer ?? false} isReportedForSpam={userData?.isReportedForSpam ?? false} fid={userData?.fid ?? undefined} address={address} />
      </div>
    );
  }

  const content = (
    <div className="flex items-center gap-1">
      <span>{profile.username}</span>
      <Badge className="z-20 relative" isKnownSpammer={userData?.isKnownSpammer ?? false} isReportedForSpam={userData?.isReportedForSpam ?? false} fid={userData?.fid ?? undefined} address={address} />
    </div>
  );

  if (noLink) {
    return content;
  }

  return (
    <div className="flex items-center gap-1 relative z-10">
      <Link 
        href={`/profile/address/${profile.address}`}
        className="hover:underline focus:outline-none focus:underline"
        onClick={(e) => {
          // Ensure this link click doesn't interfere with other interactions
          e.stopPropagation();
        }}
      >
        {profile.username}
      </Link>
      <Badge className="z-20 relative" isKnownSpammer={userData?.isKnownSpammer ?? false} isReportedForSpam={userData?.isReportedForSpam ?? false} fid={userData?.fid ?? undefined} address={address} />
    </div>
  );
};

export const Name = memo(NameComponent);
export default Name;


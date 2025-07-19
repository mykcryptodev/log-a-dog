import Link from "next/link";
import { type FC, memo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { api } from "~/utils/api";
import { ProfileButton } from "./Button";
import { DEFAULT_CHAIN } from "~/constants";
import { Badge } from "./Badge";

const NameComponent: FC<{ address: string; noLink?: boolean }> = ({ address, noLink }) => {
  const account = useActiveAccount();
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

  if (profile?.username === "" && account?.address.toLowerCase() === address.toLowerCase()) {
    return (
      <ProfileButton hideLogout />
    );
  }

  if (profile?.username === "") {
    return (
      <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
    )
  }

  if (!profile) {
    return (
      <span>Unknown</span>
    );
  }

  
  const content = (
    <div className="flex items-center gap-1">
      <span>{profile.username}</span>
      <Badge isKnownSpammer={userData?.isKnownSpammer ?? false} fid={userData?.fid ?? undefined} address={address} />
    </div>
  );

  if (noLink) {
    return content;
  }

  return (
    <Link href={`/profile/address/${profile.address}`}>
      {content}
    </Link>
  );
};

export const Name = memo(NameComponent);
export default Name;


import Link from "next/link";
import { type FC } from "react";
import { useActiveAccount } from "thirdweb/react";
import { DEFAULT_CHAIN } from "~/constants";
import { api } from "~/utils/api";
import { ProfileButton } from "./Button";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

export const Name: FC<{ address: string; noLink?: boolean }> = ({ address, noLink }) => {
  const activeChain = DEFAULT_CHAIN;
  const account = useActiveAccount();
  const { data: profile, isLoading } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
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

  console.log({ userData });

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
      {userData?.fid && (
        <CheckBadgeIcon className="w-4 h-4 text-primary" />
      )}
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

export default Name;


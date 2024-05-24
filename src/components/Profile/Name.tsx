import Link from "next/link";
import { FC } from "react";
import useActiveChain from "~/hooks/useActiveChain";
import { api } from "~/utils/api";

export const Name: FC<{ address: string }> = ({ address }) => {
  const { activeChain } = useActiveChain();
  const { data: profile, isLoading } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address,
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
  if (!profile) {
    return (
      <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
    )
  }
  return (
    <Link href={`/profile/${profile.username}`}>{profile.username}</Link>
  );
};

export default Name;


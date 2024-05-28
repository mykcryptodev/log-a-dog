import Link from "next/link";
import { type FC, useContext } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";

export const Name: FC<{ address: string }> = ({ address }) => {
  const { activeChain } = useContext(ActiveChainContext);
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
  
  return (
    <Link href={`/profile/${profile.username}`}>{profile.username}</Link>
  );
};

export default Name;


import { FC, useContext } from "react";
import { MediaRenderer } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import { api } from "~/utils/api";

export const Avatar: FC<{ address: string }> = ({ address }) => {
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
      <div className="w-4 h-4 bg-base-200 rounded-full animate-pulse" />
    );
  }
  if (!profile) {
    return null;
  }
  return (
    <MediaRenderer
      client={client}
      src={profile?.imgUrl}
      className="w-4 h-4 rounded-full"
      height={"32px"}
      width={"32px"}
    />
  );
};

export default Avatar;
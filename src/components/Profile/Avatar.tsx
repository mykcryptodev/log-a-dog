import { type FC, useContext } from "react";
import { MediaRenderer } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import { api } from "~/utils/api";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { ADDRESS_ZERO } from "thirdweb";

export const Avatar: FC<{ address: string, fallbackSize?: number, size?: string }> = ({ address, fallbackSize, size }) => {
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
  console.log({ profile });
  if (profile?.imgUrl === "") {
    return (
      <div className={'mt-1.5'}>
        <Jazzicon
          diameter={fallbackSize ?? 16}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
          seed={jsNumberForAddress(address)}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={'mt-1.5'}>
        <Jazzicon
          diameter={fallbackSize ?? 16}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
          seed={jsNumberForAddress(ADDRESS_ZERO)}
        />
      </div>
    )
  }

  return (
    <MediaRenderer
      client={client}
      src={profile.imgUrl}
      className="w-4 h-4 rounded-full"
      height={size ?? "32px"}
      width={size ?? "32px"}
    />
  );
};

export default Avatar;
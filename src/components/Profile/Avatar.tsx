import { type FC, useContext, useMemo, memo } from "react";
import { MediaRenderer } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import { api } from "~/utils/api";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { ADDRESS_ZERO } from "thirdweb";

const AvatarComponent: FC<{ address: string, fallbackSize?: number, size?: string }> = ({ address, fallbackSize, size }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { data: profile, isLoading } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address,
    }, {
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const dimension = size ?? "32px";

  // Memoize style objects to prevent re-creation on every render
  const loadingStyle = useMemo(() => ({ 
    width: dimension, 
    height: dimension 
  }), [dimension]);

  const mediaStyle = useMemo(() => ({ 
    width: dimension, 
    height: dimension, 
    objectFit: "cover" as const 
  }), [dimension]);

  if (isLoading) {
    return (
      <div
        style={loadingStyle}
        className="bg-base-200 rounded-full animate-pulse"
      />
    );
  }
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
      className="rounded-full"
      style={mediaStyle}
    />
  );
};

export const Avatar = memo(AvatarComponent);
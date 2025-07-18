import { type FC, memo } from "react";
import { MediaRenderer } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { api } from "~/utils/api";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { ZERO_ADDRESS } from "thirdweb";
import { DEFAULT_CHAIN } from "~/constants";

const AvatarComponent: FC<{ address: string; fallbackSize?: number; size?: string }> = ({ address, fallbackSize, size }) => {
  const { data: profile, isLoading } = api.profile.getByAddress.useQuery({
    chainId: DEFAULT_CHAIN.id,
    address,
    }, {
    enabled: !!address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const dimension = size ?? "32px";

  if (isLoading) {
    return (
      <div
        style={{ width: dimension, height: dimension }}
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
          seed={jsNumberForAddress(ZERO_ADDRESS)}
        />
      </div>
    )
  }

  return (
    <MediaRenderer
      client={client}
      src={profile.imgUrl}
      className="rounded-full"
      style={{ width: dimension, height: dimension, objectFit: "cover" }}
    />
  );
};

export const Avatar = memo(AvatarComponent);
export default Avatar;
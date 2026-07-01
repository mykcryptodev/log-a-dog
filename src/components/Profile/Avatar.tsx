import { type FC, memo } from "react";
import { Blobbie, MediaRenderer } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { api } from "~/utils/api";
import { ZERO_ADDRESS } from "thirdweb";
import { DEFAULT_CHAIN } from "~/constants";
import { getProxiedUrl } from "~/utils/imageProxy";

function avatarPixelSize(size?: string, fallbackSize?: number): number {
  if (fallbackSize != null) return fallbackSize;
  if (!size) return 32;
  const parsed = Number.parseInt(size, 10);
  return Number.isFinite(parsed) ? parsed : 32;
}

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
  const pixelSize = avatarPixelSize(size, fallbackSize);

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
      <Blobbie
        address={address}
        size={pixelSize}
        className="shrink-0 rounded-full"
      />
    );
  }

  if (!profile) {
    return (
      <Blobbie
        address={ZERO_ADDRESS}
        size={pixelSize}
        className="shrink-0 rounded-full"
      />
    );
  }

  return (
    <MediaRenderer
      client={client}
      src={getProxiedUrl(profile.imgUrl)}
      className="rounded-full"
      style={{ width: dimension, height: dimension, objectFit: "cover" }}
    />
  );
};

export const Avatar = memo(AvatarComponent);
export default Avatar;

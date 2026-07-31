import { type FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tweet } from "react-tweet";
import { ZERO_ADDRESS } from "thirdweb";
import { Blobbie } from "thirdweb/react";
import HotdogImage from "~/components/utils/HotdogImage";
import { DEFAULT_CHAIN } from "~/constants";
import { api } from "~/utils/api";
import { getProxiedUrl } from "~/utils/imageProxy";
import { TOP_DOGS } from "~/utils/topDogs";

type TopDogCardProps = {
  logId: string;
  prizeUsd: number;
  pickedBy: string;
};

const nameFor = (
  profile: { name?: string | null; username?: string | null } | null | undefined,
  address: string,
) => profile?.name ?? profile?.username ?? `${address.slice(0, 6)}…${address.slice(-4)}`;

const TopDogAvatar: FC<{
  address: string;
  profile?: { name?: string | null; username?: string | null; image?: string | null } | null;
}> = ({ address, profile }) => {
  const avatarUrl = profile?.image;
  if (avatarUrl && avatarUrl !== "") {
    return (
      <Image
        src={getProxiedUrl(avatarUrl)}
        alt={nameFor(profile, address)}
        width={24}
        height={24}
        className="h-6 w-6 shrink-0 rounded-full object-cover"
      />
    );
  }
  return <Blobbie address={address} size={24} className="shrink-0 rounded-full" />;
};

const TopDogCard: FC<TopDogCardProps> = ({ logId, prizeUsd, pickedBy }) => {
  const { data, isLoading } = api.hotdog.getById.useQuery(
    {
      chainId: DEFAULT_CHAIN.id,
      user: ZERO_ADDRESS,
      logId,
    },
    { enabled: !!logId && !!DEFAULT_CHAIN.id },
  );

  if (isLoading || !data) {
    return (
      <div className="grill-skeleton animate-grill-shimmer h-24 rounded-2xl" />
    );
  }

  const { hotdog } = data;
  const profile = hotdog.eaterProfile;
  const address = hotdog.eater;

  return (
    <Link
      href={`/dog/${logId}`}
      className="flex items-center gap-3 rounded-2xl border-2 border-base-content bg-base-100 p-3 transition-colors hover:bg-base-200"
    >
      <div className="pop-frame h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <HotdogImage
          src={hotdog.imageUri}
          zoraCoin={hotdog.zoraCoin}
          width="64px"
          height="64px"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TopDogAvatar address={address} profile={profile} />
          <span className="truncate font-semibold">{nameFor(profile, address)}</span>
        </div>
        <p className="mt-0.5 text-sm text-base-content/70">
          Dog #{logId} · Picked by {pickedBy}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-xl tabular-nums text-secondary">${prizeUsd}</p>
        <p className="text-xs text-base-content/60">$HOTDOG prize</p>
      </div>
    </Link>
  );
};

export function TopDogs() {
  return (
    <section className="w-full space-y-3">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          🥇 TOP DOGS
        </h2>
        <p className="mt-1 text-sm text-base-content/70">
          $50 in $HOTDOG for the dog our weekly celebrity guest picks
        </p>
      </div>
      <div className="pop-card space-y-2 rounded-2xl bg-base-100 p-3">
        {TOP_DOGS.map((topDog) => (
          <div key={topDog.logId} className="space-y-2">
            <TopDogCard
              logId={topDog.logId}
              prizeUsd={topDog.prizeUsd}
              pickedBy={topDog.pickedBy}
            />
            {topDog.tweetId && (
              <div className="mx-auto flex max-w-sm justify-center [&_.react-tweet-theme]:my-0">
                <Tweet id={topDog.tweetId} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default TopDogs;

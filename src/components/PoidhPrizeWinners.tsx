import { type FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { ZERO_ADDRESS } from "thirdweb";
import { Blobbie } from "thirdweb/react";
import HotdogImage from "~/components/utils/HotdogImage";
import { DEFAULT_CHAIN } from "~/constants";
import { api } from "~/utils/api";
import { getProxiedUrl } from "~/utils/imageProxy";
import { POIDH_PRIZE_WINNERS } from "~/utils/poidh";

type WinnerCardProps = {
  logId: string;
  prizeUsd: number;
};

const nameFor = (
  profile: { name?: string | null; username?: string | null } | null | undefined,
  address: string,
) => profile?.name ?? profile?.username ?? `${address.slice(0, 6)}…${address.slice(-4)}`;

const WinnerAvatar: FC<{
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

const WinnerCard: FC<WinnerCardProps> = ({ logId, prizeUsd }) => {
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
          <WinnerAvatar address={address} profile={profile} />
          <span className="truncate font-semibold">{nameFor(profile, address)}</span>
        </div>
        <p className="mt-0.5 text-sm text-base-content/70">
          Dog #{logId} · POIDH bounty winner
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-xl tabular-nums text-secondary">${prizeUsd}</p>
        <p className="text-xs text-base-content/60">ETH prize</p>
      </div>
    </Link>
  );
};

export function PoidhPrizeWinners() {
  return (
    <section className="w-full space-y-3">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          🕹️ POIDH PRIZE WINNERS
        </h2>
        <p className="mt-1 text-sm text-base-content/70">
          $50 ETH daily bounty winners from the Fourth of July campaign
        </p>
      </div>
      <div className="pop-card space-y-2 rounded-2xl bg-base-100 p-3">
        {POIDH_PRIZE_WINNERS.map((winner) => (
          <WinnerCard key={winner.logId} logId={winner.logId} prizeUsd={winner.prizeUsd} />
        ))}
      </div>
    </section>
  );
}

export default PoidhPrizeWinners;

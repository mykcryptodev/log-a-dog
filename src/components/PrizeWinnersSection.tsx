import { type FC, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tweet } from "react-tweet";
import { ZERO_ADDRESS } from "thirdweb";
import { Blobbie } from "thirdweb/react";
import HotdogImage from "~/components/utils/HotdogImage";
import { DEFAULT_CHAIN } from "~/constants";
import { api } from "~/utils/api";
import { getProxiedUrl } from "~/utils/imageProxy";

export type PrizeWinnerEntry = {
  logId: string;
  prizeUsd: number;
  /** Shown after "Dog #123 · " on the card, e.g. "POIDH bounty winner". */
  caption: string;
  /** Optional announcement tweet rendered under the card. */
  tweetId?: string;
};

type PrizeWinnersSectionProps = {
  title: string;
  subtitle: string;
  /** Small label under the dollar amount, e.g. "$HOTDOG prize". */
  prizeLabel: string;
  entries: readonly PrizeWinnerEntry[];
  link?: { href: string; label: string };
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

/**
 * Collapsed by default. The <Tweet> only mounts once opened, so a collapsed
 * embed costs no syndication fetch on page load.
 */
const TweetDisclosure: FC<{ tweetId: string }> = ({ tweetId }) => {
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <details
      className="group"
      onToggle={(e) => {
        if (e.currentTarget.open) setHasOpened(true);
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-center gap-1 py-1 text-xs font-bold uppercase tracking-wide opacity-70 hover:opacity-100">
        <span className="group-open:hidden">watch the announcement</span>
        <span className="hidden group-open:inline">hide</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-base-content transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      {hasOpened && (
        <div className="mx-auto mt-2 flex max-w-sm justify-center [&_.react-tweet-theme]:my-0">
          <Tweet id={tweetId} />
        </div>
      )}
    </details>
  );
};

const WinnerCard: FC<{ entry: PrizeWinnerEntry; prizeLabel: string }> = ({
  entry,
  prizeLabel,
}) => {
  const { logId, prizeUsd, caption } = entry;
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
          Dog #{logId} · {caption}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-xl tabular-nums text-secondary">${prizeUsd}</p>
        <p className="text-xs text-base-content/60">{prizeLabel}</p>
      </div>
    </Link>
  );
};

export function PrizeWinnersSection({
  title,
  subtitle,
  prizeLabel,
  entries,
  link,
}: PrizeWinnersSectionProps) {
  return (
    <section className="w-full space-y-3">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-base-content/70">{subtitle}</p>
        {link && (
          <Link
            href={link.href}
            className="mt-2 inline-block font-display text-sm tracking-wide text-secondary hover:underline"
          >
            {link.label}
          </Link>
        )}
      </div>
      <div className="pop-card space-y-2 rounded-2xl bg-base-100 p-3">
        {entries.map((entry) =>
          entry.tweetId ? (
            <div key={entry.logId} className="space-y-2">
              <WinnerCard entry={entry} prizeLabel={prizeLabel} />
              <TweetDisclosure tweetId={entry.tweetId} />
            </div>
          ) : (
            <WinnerCard key={entry.logId} entry={entry} prizeLabel={prizeLabel} />
          ),
        )}
      </div>
    </section>
  );
}

export default PrizeWinnersSection;

import { type FC, type MouseEvent, memo, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  CurrencyDollarIcon,
  FireIcon,
  UsersIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { isAddressEqual } from "viem";
import HotdogImage from "~/components/utils/HotdogImage";
import { Avatar } from "~/components/Profile/Avatar";
import { Badge } from "~/components/Profile/Badge";
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "~/components/Attestation/AiJudgement";
import Comments from "~/components/Attestation/Comments";
import VoteBar from "~/components/Attestation/VoteBar";
import VotingCountdown from "~/components/Attestation/VotingCountdown";
import ZoraCoinTrading from "~/components/Attestation/ZoraCoinTrading";
import VerdictStamp from "~/components/utils/VerdictStamp";
import { formatAbbreviatedFiat } from "~/helpers/formatFiat";
import { ATTESTATION_WINDOW_SECONDS, MAKER_WALLET } from "~/constants";
import { env } from "~/env";
import Image from "next/image";
import { sdk } from "@farcaster/frame-sdk";
import { FarcasterContext } from "~/providers/Farcaster";
import EthCommentsModal from "../EthCommentsModal";
import { useActiveAccount } from "thirdweb/react";

// Types
type AttestationPeriod = {
  startTime: string;
  endTime: string;
  status: number;
  totalValidStake: string;
  totalInvalidStake: string;
  isValid: boolean;
};

type ZoraCoinDetails = {
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  totalVolume: string;
  volume24h?: string;
  createdAt?: string;
  creatorAddress?: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  chainId?: number;
  uniqueHolders?: number;
  mediaContent?: {
    mimeType?: string;
    originalUri?: string;
    previewImage?: {
      small?: string;
      medium?: string;
      blurhash?: string;
    };
  };
  link?: string;
};

type HotdogData = {
  logId: string;
  imageUri: string;
  metadataUri: string;
  timestamp: string;
  eater: string;
  logger: string;
  zoraCoin: ZoraCoinDetails | string | null; // Can be object, string, or null
  attestationPeriod?: AttestationPeriod;
  isPending?: boolean;
  duplicateOfLogId?: string | null;
  eaterProfile?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
    isDisqualified?: boolean | null;
  } | null;
  loggerProfile?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
    isDisqualified?: boolean | null;
  } | null;
};

type Props = {
  hotdog: HotdogData;
  validAttestations: string;
  invalidAttestations: string;
  userAttested: boolean;
  userAttestation: boolean;
  chainId: number;
  onRefetch: () => void;
  linkToDetail?: boolean; // Whether to link the image to the detail page
  showAiJudgement?: boolean; // Whether to show AI judgement
  disabled?: boolean; // Whether judgement is disabled (for pending)
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

// Rarity tiers, derived from engagement (verdicts cast) and market cap. Each
// tier paints a different foil gradient on the card frame.
const rarityFor = (totalVotes: number, marketCap: number) => {
  if (totalVotes >= 50 || marketCap >= 10000)
    return {
      name: "LEGENDARY",
      stars: 4,
      foil: "linear-gradient(115deg,#ffd23f,#ff7b3a,#ffe88a,#ff4da6,#7b5bff,#3ad0ff,#ffd23f)",
      chip: "bg-amber-300 text-black",
    };
  if (totalVotes >= 15 || marketCap >= 2000)
    return {
      name: "EPIC",
      stars: 3,
      foil: "linear-gradient(115deg,#a24bff,#ff7be0,#7b3aff,#ff9bf0,#a24bff)",
      chip: "bg-fuchsia-400 text-black",
    };
  if (totalVotes >= 5)
    return {
      name: "RARE",
      stars: 2,
      foil: "linear-gradient(115deg,#3aa0ff,#7fe0ff,#2b7fff,#a0f0ff,#3aa0ff)",
      chip: "bg-sky-300 text-black",
    };
  return {
    name: "COMMON",
    stars: 1,
    foil: "linear-gradient(115deg,#c2ccd6,#eef2f6,#aab4bd,#dfe6eb,#c2ccd6)",
    chip: "bg-slate-200 text-black",
  };
};

const HotdogCardComponent: FC<Props> = ({
  hotdog,
  validAttestations,
  invalidAttestations,
  userAttested,
  userAttestation,
  chainId,
  onRefetch,
  linkToDetail = false,
  showAiJudgement = false,
  disabled = false,
}) => {
  const account = useActiveAccount();
  const [flipped, setFlipped] = useState(false);

  const showLoggedVia = (hotdog: { eater: string; logger: string }) => {
    const loggerIsNotEater = !isAddressEqual(
      hotdog.eater as `0x${string}`,
      hotdog.logger as `0x${string}`,
    );
    const loggerIsNotBackendWallet = !isAddressEqual(
      hotdog.logger as `0x${string}`,
      env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`,
    );
    const loggerIsNotMakerWallet = !isAddressEqual(
      hotdog.logger as `0x${string}`,
      MAKER_WALLET,
    );
    return (
      loggerIsNotEater && loggerIsNotBackendWallet && loggerIsNotMakerWallet
    );
  };

  const displayName =
    hotdog.eaterProfile?.name ??
    hotdog.eaterProfile?.username ??
    `${hotdog.eater.slice(0, 6)}...${hotdog.eater.slice(-4)}`;

  const loggerDisplayName =
    hotdog.loggerProfile?.name ??
    hotdog.loggerProfile?.username ??
    `${hotdog.logger.slice(0, 6)}...${hotdog.logger.slice(-4)}`;

  const isExpired =
    Number(hotdog.timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000 <=
    Date.now();

  const isResolved = hotdog.attestationPeriod?.status === 1;

  const shareUrl = `${env.NEXT_PUBLIC_APP_URL}/dog/${hotdog.logId}`;
  const shareText = `be like ${displayName}, log your dogs! 🌭`;

  const shareOnX = useCallback(() => {
    const url =
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` +
      `&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  }, [shareUrl, shareText]);

  const farcaster = useContext(FarcasterContext);
  const shareOnFarcaster = useCallback(async () => {
    try {
      if (farcaster?.isMiniApp) {
        await sdk.actions.composeCast({
          text: shareText,
          embeds: [shareUrl],
        });
      } else {
        const url =
          `https://farcaster.xyz/~/compose?text=${encodeURIComponent(shareText)}` +
          `&embeds[]=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Failed to compose cast", err);
    }
  }, [shareUrl, shareText, farcaster]);

  // Handle zoraCoin being either an object or string
  const zoraCoinData =
    typeof hotdog.zoraCoin === "object" ? hotdog.zoraCoin : null;
  const zoraCoinAddress =
    zoraCoinData?.address ??
    (typeof hotdog.zoraCoin === "string" ? hotdog.zoraCoin : undefined);

  // Full-bleed 4:5 photo (Instagram portrait), object-cover with blurhash.
  const Photo = (
    <HotdogImage
      src={hotdog.imageUri}
      zoraCoin={zoraCoinData}
      className="h-full w-full object-cover"
      width="100%"
      height="100%"
    />
  );

  const totalVotes =
    Number(validAttestations || "0") + Number(invalidAttestations || "0");
  const marketCap = zoraCoinData?.marketCap ? Number(zoraCoinData.marketCap) : 0;
  const tier = rarityFor(totalVotes, marketCap);
  const starStr = "★★★★".slice(0, tier.stars) + "☆☆☆☆".slice(0, 4 - tier.stars);

  const flip = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFlipped((f) => !f);
  };

  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="holo-frame rounded-[1.85rem] p-[3px] shadow-dog"
      style={{ backgroundImage: tier.foil }}
    >
      <div className="overflow-hidden rounded-[1.7rem] bg-base-100">
        <div className="flex flex-col gap-3 p-4">
          {/* Identity row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col items-start">
              <div className="flex w-fit items-center gap-1">
                <Link
                  href={`/profile/${hotdog.eater}`}
                  className="flex items-center gap-2"
                >
                  <Avatar address={hotdog.eater} fallbackSize={28} />
                  <span className="truncate text-sm font-semibold">{displayName}</span>
                </Link>
                <Badge
                  address={hotdog.eater}
                  fid={hotdog.eaterProfile?.fid}
                  isKnownSpammer={hotdog.eaterProfile?.isKnownSpammer}
                  isReportedForSpam={hotdog.eaterProfile?.isReportedForSpam}
                  isDisqualified={hotdog.eaterProfile?.isDisqualified}
                />
              </div>
              {showLoggedVia({ eater: hotdog.eater, logger: hotdog.logger }) && (
                <div className="flex items-center gap-1 text-xs opacity-60">
                  <span>via</span>
                  <Avatar address={hotdog.logger} size="16px" />
                  <span>{loggerDisplayName}</span>
                  <Badge
                    address={hotdog.logger}
                    fid={hotdog.loggerProfile?.fid}
                    isKnownSpammer={hotdog.loggerProfile?.isKnownSpammer}
                    isReportedForSpam={hotdog.loggerProfile?.isReportedForSpam}
                    isDisqualified={hotdog.loggerProfile?.isDisqualified}
                  />
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <EthCommentsModal logId={hotdog.logId} account={account} />
              <button
                onClick={shareOnX}
                className="btn btn-circle btn-ghost btn-xs w-fit px-2"
              >
                <Image src="/images/x.svg" alt="Share on X" width={16} height={16} className="dark:hidden" />
                <Image src="/images/x-white.svg" alt="Share on X" width={16} height={16} className="hidden dark:block" />
              </button>
              <button
                onClick={shareOnFarcaster}
                className="btn btn-circle btn-ghost btn-xs w-fit px-2"
              >
                <Image src="/images/farcaster.svg" alt="Share on Farcaster" width={16} height={16} />
              </button>
              <Revoke hotdog={hotdog} onRevocation={onRefetch} />
            </div>
          </div>

          {/* Flip panel — front = photo (holo), back = market stats/trading. */}
          <div className={`flip-3d aspect-[4/5] w-full ${hotdog.duplicateOfLogId ? "opacity-60" : ""}`}>
            <div className={`flip-inner ${flipped ? "is-flipped" : ""}`}>
              {/* FRONT */}
              <div className="flip-face rounded-2xl bg-base-300">
                {linkToDetail ? (
                  <Link href={`/dog/${hotdog.logId}`} className="block h-full w-full">
                    {Photo}
                  </Link>
                ) : (
                  Photo
                )}

                {/* Holographic sheen sweep */}
                <div className="holo-sheen pointer-events-none absolute inset-0" />

                {/* Rarity chip */}
                <span
                  className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[0.65rem] tracking-wider shadow ${tier.chip}`}
                >
                  {tier.name}
                  <span className="tracking-normal">{starStr}</span>
                </span>

                {hotdog.duplicateOfLogId && (
                  <Link
                    href={`/dog/${hotdog.duplicateOfLogId}`}
                    className="badge badge-warning absolute bottom-3 left-3"
                  >
                    Duplicate Image
                  </Link>
                )}

                {isResolved && hotdog.attestationPeriod && (
                  <VerdictStamp valid={hotdog.attestationPeriod.isValid} />
                )}

                {!isExpired && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-base-100/80 px-2 py-1 backdrop-blur-sm">
                    <VotingCountdown
                      timestamp={hotdog.timestamp.toString()}
                      logId={hotdog.logId?.toString() ?? ""}
                      validAttestations={validAttestations}
                      invalidAttestations={invalidAttestations}
                      onResolutionComplete={onRefetch}
                      attestationPeriod={hotdog.attestationPeriod}
                    />
                  </div>
                )}

                {/* Flip-to-stats button */}
                <button
                  onClick={flip}
                  aria-label="Flip card for market stats"
                  className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-base-100/85 px-2.5 py-1 text-xs font-semibold shadow backdrop-blur-sm"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  stats
                </button>
              </div>

              {/* BACK */}
              <div className="flip-face flip-back flex flex-col gap-2 rounded-2xl bg-base-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm tracking-wide">📊 #{hotdog.logId.toString()} · stats</span>
                  <button
                    onClick={flip}
                    aria-label="Flip card back"
                    className="flex items-center gap-1 rounded-full bg-base-100 px-2.5 py-1 text-xs font-semibold shadow"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    back
                  </button>
                </div>

                <div className={`flex items-center gap-1 rounded-lg px-2 py-1 font-display text-xs tracking-wider ${tier.chip}`}>
                  {tier.name} {starStr}
                </div>

                {zoraCoinData ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-base-100 p-2">
                      <CurrencyDollarIcon className="mx-auto h-4 w-4 opacity-60" />
                      <div className="font-display text-sm tabular-nums">
                        ${formatAbbreviatedFiat(Number(zoraCoinData.marketCap ?? 0))}
                      </div>
                      <div className="text-[0.6rem] opacity-60">MCAP</div>
                    </div>
                    <div className="rounded-xl bg-base-100 p-2">
                      <FireIcon className="mx-auto h-4 w-4 opacity-60" />
                      <div className="font-display text-sm tabular-nums">
                        ${formatAbbreviatedFiat(Number(zoraCoinData.volume24h ?? 0))}
                      </div>
                      <div className="text-[0.6rem] opacity-60">24H VOL</div>
                    </div>
                    <div className="rounded-xl bg-base-100 p-2">
                      <UsersIcon className="mx-auto h-4 w-4 opacity-60" />
                      <div className="font-display text-sm tabular-nums">
                        {zoraCoinData.uniqueHolders ?? 0}
                      </div>
                      <div className="text-[0.6rem] opacity-60">HOLDERS</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-center text-xs opacity-60">
                    {zoraCoinAddress ? "Loading market data…" : "No coin market yet."}
                  </div>
                )}

                {zoraCoinAddress && (
                  <div className="mt-auto flex items-center justify-between gap-2 text-xs">
                    <ZoraCoinTrading
                      referrer={hotdog.eater}
                      coinAddress={zoraCoinAddress}
                      logId={hotdog.logId}
                      onTradeComplete={noop}
                    />
                    <Link
                      href={
                        zoraCoinData?.link ??
                        `https://zora.co/coin/base:${zoraCoinAddress}?referrer=0x3dE0ba94A1F291A7c44bb029b765ADB2C487063F`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link shrink-0 opacity-70"
                    >
                      Zora ↗
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* THE vote control — primary, full-width */}
          <VoteBar
            logId={hotdog.logId}
            chainId={chainId}
            disabled={disabled}
            isExpired={isExpired}
            userAttested={userAttested}
            userAttestation={userAttestation}
            validAttestations={validAttestations}
            invalidAttestations={invalidAttestations}
            onAttestationMade={onRefetch}
            onAttestationAffirmationRevoked={onRefetch}
          />

          {/* Metadata row: comments · season number */}
          <div className="flex items-center justify-between text-sm">
            <Comments
              logId={hotdog.logId?.toString() ?? ""}
              metadataUri={hotdog.metadataUri}
            />
            {showAiJudgement && (
              <AiJudgement
                logId={hotdog.logId.toString()}
                timestamp={hotdog.timestamp.toString()}
              />
            )}
            <span className="font-display text-base tracking-wide opacity-70">
              🌭 #{hotdog.logId.toString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Memoized so that a re-render of the parent feed (e.g. the 30s
// `clearExpiredPending` interval tick or pagination) doesn't re-render every
// card. This relies on the parent passing a stable `onRefetch` callback.
// See React rule `rerender-memo`.
export const HotdogCard = memo(HotdogCardComponent);

export default HotdogCard;

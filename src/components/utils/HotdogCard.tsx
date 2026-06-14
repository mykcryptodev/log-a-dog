import { type FC, memo, useCallback, useContext } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  CurrencyDollarIcon,
  FireIcon,
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

  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="card glass-card overflow-hidden rounded-3xl border-4 border-[#1a1a1a]/5"
    >
      <div className="flex flex-col gap-3 p-4">
        {/* Identity row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <div className="flex w-fit items-center gap-1">
              <Link
                href={`/profile/${hotdog.eater}`}
                className="flex items-center gap-2"
              >
                <Avatar address={hotdog.eater} fallbackSize={28} />
                <span className="text-sm font-semibold">{displayName}</span>
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
          <div className="flex items-center gap-1">
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

        {/* Full-bleed photo with verdict stamp + countdown overlays */}
        <div
          className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-base-300 ${
            hotdog.duplicateOfLogId ? "opacity-60" : ""
          }`}
        >
          {linkToDetail ? (
            <Link href={`/dog/${hotdog.logId}`} className="block h-full w-full">
              {Photo}
            </Link>
          ) : (
            Photo
          )}

          {hotdog.duplicateOfLogId && (
            <Link
              href={`/dog/${hotdog.duplicateOfLogId}`}
              className="badge badge-warning absolute right-3 top-3"
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

        {/* Market data — collapsed by default, for the crypto-curious */}
        {zoraCoinAddress && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-xs opacity-50">
              <span className="transition-transform group-open:rotate-180">⌄</span>
              market data
            </summary>
            <div className="mt-2 flex w-full items-center justify-between text-xs opacity-70">
              <div className="flex items-center gap-2">
                <ZoraCoinTrading
                  referrer={hotdog.eater}
                  coinAddress={zoraCoinAddress}
                  logId={hotdog.logId}
                  onTradeComplete={noop}
                />
              </div>
              {zoraCoinData &&
                (Boolean(zoraCoinData.marketCap) || Boolean(zoraCoinData.volume24h)) && (
                  <Link
                    href={
                      zoraCoinData.link ??
                      `https://zora.co/coin/base:${zoraCoinData.address}?referrer=0x3dE0ba94A1F291A7c44bb029b765ADB2C487063F`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    {zoraCoinData.marketCap && (
                      <div className="flex items-center gap-0.5">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        MCAP ${formatAbbreviatedFiat(Number(zoraCoinData.marketCap))}
                      </div>
                    )}
                    {zoraCoinData.volume24h && (
                      <div className="flex items-center gap-0.5">
                        <FireIcon className="h-4 w-4" />
                        24H VOL ${formatAbbreviatedFiat(Number(zoraCoinData.volume24h))}
                      </div>
                    )}
                  </Link>
                )}
              {!zoraCoinData && (
                <div className="flex items-center gap-1">
                  <div className="loading loading-spinner loading-xs" />
                  <span>Loading market data...</span>
                </div>
              )}
            </div>
          </details>
        )}
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

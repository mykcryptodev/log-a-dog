import { type FC, useCallback, useContext } from "react";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  FireIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { isAddressEqual } from "viem";
import HotdogImage from "~/components/utils/HotdogImage";
import { Avatar } from "~/components/Profile/Avatar";
import { Badge } from "~/components/Profile/Badge";
// Removed Name import - using backend profile data instead
import Revoke from "~/components/Attestation/Revoke";
import AiJudgement from "~/components/Attestation/AiJudgement";
import Comments from "~/components/Attestation/Comments";
import JudgeAttestation from "~/components/Attestation/Judge";
import VotingCountdown from "~/components/Attestation/VotingCountdown";
import AttestationStatusBadge from "~/components/Attestation/AttestationStatusBadge";
import ZoraCoinTrading from "~/components/Attestation/ZoraCoinTrading";
import { formatAbbreviatedFiat } from "~/helpers/formatFiat";
import { ATTESTATION_WINDOW_SECONDS, MAKER_WALLET } from "~/constants";
import { env } from "~/env";
import Image from "next/image";
import { sdk } from "@farcaster/frame-sdk";
// Removed api import - using backend profile data instead
import { FarcasterContext } from "~/providers/Farcaster";

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
  } | null;
  loggerProfile?: {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    fid?: number | null;
    isKnownSpammer?: boolean | null;
    isReportedForSpam?: boolean | null;
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

export const HotdogCard: FC<Props> = ({
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

  const ImageComponent = linkToDetail ? (
    <Link
      href={`/dog/${hotdog.logId}`}
      className={`flex w-full items-center justify-center ${hotdog.duplicateOfLogId ? "opacity-50" : ""}`}
    >
      <HotdogImage
        src={hotdog.imageUri}
        zoraCoin={zoraCoinData}
        className="rounded-lg"
        width="400"
        height="400"
      />
    </Link>
  ) : (
    <HotdogImage
      src={hotdog.imageUri}
      zoraCoin={zoraCoinData}
      className="rounded-lg"
      width="100%"
      height="100%"
    />
  );

  return (
    <div className="card bg-base-200 bg-opacity-25 shadow backdrop-blur-sm">
      <div className="card-body max-w-lg p-4">
        {/* Header with user info and revoke button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <div className="flex w-fit items-center gap-1">
              <Link href={`/profile/${hotdog.eater}`} className="flex items-center gap-2">
                <Avatar address={hotdog.eater} fallbackSize={24} />
                <span className="text-sm font-medium">{displayName}</span>
              </Link>              
              <Badge 
                address={hotdog.eater}
                fid={hotdog.eaterProfile?.fid}
                isKnownSpammer={hotdog.eaterProfile?.isKnownSpammer}
                isReportedForSpam={hotdog.eaterProfile?.isReportedForSpam}
              />
            </div>
            <div className="flex flex-col">
              {showLoggedVia({
                eater: hotdog.eater,
                logger: hotdog.logger,
              }) && (
                <div className="flex items-center gap-1 text-xs opacity-75">
                  <span>via</span>
                  <Avatar address={hotdog.logger} size="16px" />
                  <span>{loggerDisplayName}</span>
                  <Badge 
                    address={hotdog.logger}
                    fid={hotdog.loggerProfile?.fid}
                    isKnownSpammer={hotdog.loggerProfile?.isKnownSpammer}
                    isReportedForSpam={hotdog.loggerProfile?.isReportedForSpam}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shareOnX}
              className="btn btn-circle btn-ghost btn-xs w-fit px-2"
            >
              <Image
                src="/images/x.svg"
                alt="Share on X"
                width={16}
                height={16}
                className="dark:hidden"
              />
              <Image
                src="/images/x-white.svg"
                alt="Share on X"
                width={16}
                height={16}
                className="hidden dark:block"
              />
            </button>
            <button
              onClick={shareOnFarcaster}
              className="btn btn-circle btn-ghost btn-xs w-fit px-2"
            >
              <Image
                src="/images/farcaster.svg"
                alt="Share on Farcaster"
                width={16}
                height={16}
              />
            </button>
            <Revoke hotdog={hotdog} onRevocation={onRefetch} />
          </div>
        </div>

        {/* Image with duplicate badge overlay */}
        <div className="relative">
          {ImageComponent}
          {hotdog.duplicateOfLogId && (
            <Link
              href={`/dog/${hotdog.duplicateOfLogId}`}
              className="badge badge-warning absolute right-4 top-4"
            >
              Duplicate Image
            </Link>
          )}
        </div>

        {/* Bottom section with attestation info and actions */}
        <div className="flex w-full flex-row items-center justify-between opacity-50">
          <div className="flex items-center gap-1 text-xs">
            {hotdog.attestationPeriod ? (
              <AttestationStatusBadge
                attestationPeriod={hotdog.attestationPeriod}
              />
            ) : (
              <>
                <TagIcon className="h-4 w-4" />
                {hotdog.logId.toString()}
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 text-xs">
            {showAiJudgement && (
              <AiJudgement
                logId={hotdog.logId.toString()}
                timestamp={hotdog.timestamp.toString()}
              />
            )}
            <VotingCountdown
              timestamp={hotdog.timestamp.toString()}
              logId={hotdog.logId?.toString() ?? ""}
              validAttestations={validAttestations}
              invalidAttestations={invalidAttestations}
              onResolutionComplete={onRefetch}
              attestationPeriod={hotdog.attestationPeriod}
            />
          </div>
          <div className="flex items-center justify-end gap-1">
            <Comments
              logId={hotdog.logId?.toString() ?? ""}
              metadataUri={hotdog.metadataUri}
            />
            {!isExpired && (
              <JudgeAttestation
                disabled={disabled}
                userAttested={userAttested}
                userAttestation={userAttestation}
                validAttestations={validAttestations}
                invalidAttestations={invalidAttestations}
                logId={hotdog.logId}
                chainId={chainId}
                onAttestationMade={onRefetch}
                onAttestationAffirmationRevoked={onRefetch}
              />
            )}
          </div>
        </div>

        {/* Zora coin trading and market info */}
        {zoraCoinData?.address && (
          <div className="flex w-full items-center justify-between text-xs opacity-50">
            <div className="flex items-center gap-2">
              <ZoraCoinTrading
                referrer={hotdog.eater}
                coinAddress={zoraCoinData.address}
                logId={hotdog.logId}
                onTradeComplete={noop}
              />
            </div>
            {(Boolean(zoraCoinData.marketCap) ||
              Boolean(zoraCoinData.volume24h)) && (
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
                    MCAP $
                    {formatAbbreviatedFiat(Number(zoraCoinData.marketCap))}
                  </div>
                )}
                {zoraCoinData.volume24h && (
                  <div className="flex items-center gap-0.5">
                    <FireIcon className="h-4 w-4" />
                    24H VOL $
                    {formatAbbreviatedFiat(Number(zoraCoinData.volume24h))}
                  </div>
                )}
                {!zoraCoinData.marketCap && !zoraCoinData.volume24h && (
                  <div className="flex items-center gap-0.5">
                    <span>View on Zora</span>
                  </div>
                )}
              </Link>
            )}
          </div>
        )}
        {/* Show loading indicator if we have an address but no detailed data yet */}
        {typeof hotdog.zoraCoin === "string" &&
          hotdog.zoraCoin &&
          !zoraCoinData && (
            <div className="flex w-full items-center justify-between text-xs opacity-50">
              <div className="flex items-center gap-2">
                <ZoraCoinTrading
                  referrer={hotdog.eater}
                  coinAddress={hotdog.zoraCoin}
                  logId={hotdog.logId}
                  onTradeComplete={noop}
                />
              </div>
              <div className="flex items-center gap-1">
                <div className="loading loading-spinner loading-xs"></div>
                <span>Loading market data...</span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default HotdogCard;

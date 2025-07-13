import { type FC } from "react";
import Link from "next/link";
import { CurrencyDollarIcon, FireIcon, TagIcon } from "@heroicons/react/24/outline";
import { isAddressEqual } from "viem";
import HotdogImage from "~/components/utils/HotdogImage";
import { Avatar } from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
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
    return loggerIsNotEater && loggerIsNotBackendWallet && loggerIsNotMakerWallet;
  };

  const isExpired = Number(hotdog.timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000 <= Date.now();

  // Handle zoraCoin being either an object or string
  const zoraCoinData = typeof hotdog.zoraCoin === 'object' ? hotdog.zoraCoin : null;

  const ImageComponent = linkToDetail ? (
    <Link href={`/dog/${hotdog.logId}`} className="w-full flex items-center justify-center">
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
    <div className="card bg-base-200 bg-opacity-25 backdrop-blur-sm shadow">
      <div className="card-body p-4 max-w-lg">
        {/* Header with user info and revoke button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 w-fit">
              <Avatar address={hotdog.eater} fallbackSize={24} />
              <Name address={hotdog.eater} />
            </div>
            <div className="flex flex-col">
              {showLoggedVia({ eater: hotdog.eater, logger: hotdog.logger }) && (
                <div className="flex items-center gap-1 text-xs opacity-75">
                  <span>via</span>
                  <Avatar address={hotdog.logger} size="16px" />
                  <Name address={hotdog.logger} />
                </div>
              )}
            </div>
          </div>
          <Revoke hotdog={hotdog} onRevocation={onRefetch} />
        </div>

        {/* Image */}
        {ImageComponent}

        {/* Bottom section with attestation info and actions */}
        <div className="opacity-50 flex flex-row w-full items-center justify-between">
          <div className="text-xs flex items-center gap-1">
            {hotdog.attestationPeriod ? (
              <AttestationStatusBadge attestationPeriod={hotdog.attestationPeriod} />
            ) : (
              <>
                <TagIcon className="w-4 h-4" />
                {hotdog.logId.toString()}
              </>
            )}
          </div>
          <div className="flex justify-end items-center gap-2 text-xs">
            {showAiJudgement && (
              <AiJudgement
                logId={hotdog.logId.toString()}
                timestamp={hotdog.timestamp.toString()}
              />
            )}
            <VotingCountdown
              timestamp={hotdog.timestamp.toString()}
              logId={hotdog.logId?.toString() ?? ''}
              validAttestations={validAttestations}
              invalidAttestations={invalidAttestations}
              onResolutionComplete={onRefetch}
              attestationPeriod={hotdog.attestationPeriod}
            />
          </div>
          <div className="flex justify-end items-center gap-1">
            <Comments
              logId={hotdog.logId?.toString() ?? ''}
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
          <div className="flex items-center text-xs w-full justify-between opacity-50">
            <div className="flex items-center gap-2">
              <ZoraCoinTrading 
                referrer={hotdog.eater}
                coinAddress={zoraCoinData.address}
                logId={hotdog.logId}
                onTradeComplete={() => {}}
              />
            </div>
            {(Boolean(zoraCoinData.marketCap) || Boolean(zoraCoinData.volume24h)) && (
              <Link 
                href={zoraCoinData.link ?? `https://zora.co/coin/base:${zoraCoinData.address}?referrer=0x3dE0ba94A1F291A7c44bb029b765ADB2C487063F`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2"
              >
                {zoraCoinData.marketCap && (
                  <div className="flex items-center gap-0.5">
                    <CurrencyDollarIcon className="w-4 h-4" /> 
                    MCAP ${formatAbbreviatedFiat(Number(zoraCoinData.marketCap))}
                  </div>
                )}
                {zoraCoinData.volume24h && (
                  <div className="flex items-center gap-0.5">
                    <FireIcon className="w-4 h-4" /> 
                    24H VOL ${formatAbbreviatedFiat(Number(zoraCoinData.volume24h))}
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
        {typeof hotdog.zoraCoin === 'string' && hotdog.zoraCoin && !zoraCoinData && (
          <div className="flex items-center text-xs w-full justify-between opacity-50">
            <div className="flex items-center gap-2">
              <ZoraCoinTrading 
                referrer={hotdog.eater}
                coinAddress={hotdog.zoraCoin}
                logId={hotdog.logId}
                onTradeComplete={() => {}}
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
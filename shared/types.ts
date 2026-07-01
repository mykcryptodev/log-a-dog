/**
 * Canonical, platform-agnostic domain types shared by the web (Next.js) and
 * mobile (Expo) apps. These mirror the shapes returned by the tRPC `hotdog`
 * router so both clients can render the same data without redeclaring types.
 *
 * Keep this file free of any React / React Native / Node imports so it can be
 * bundled by both webpack (web) and Metro (mobile).
 */

export interface HotdogProfile {
  address?: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  fid?: number | null;
  isKnownSpammer?: boolean | null;
  isReportedForSpam?: boolean | null;
  isDisqualified?: boolean | null;
}

export interface AttestationPeriod {
  startTime: string;
  endTime: string;
  status: number;
  totalValidStake: string;
  totalInvalidStake: string;
  isValid: boolean;
}

export interface ZoraCoinMediaContent {
  mimeType?: string;
  originalUri?: string;
  previewImage?: {
    small?: string;
    medium?: string;
    blurhash?: string;
  };
}

export interface ZoraCoinDetails {
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
  mediaContent?: ZoraCoinMediaContent;
  link?: string;
}

export interface HotdogMetadata {
  imageUri: string;
  eater: string;
  zoraCoin?: { address: string; name: string; symbol: string };
}

export interface ProcessedHotdog {
  logId: string;
  imageUri: string;
  metadataUri: string;
  timestamp: string;
  eater: string;
  logger: string;
  zoraCoin: ZoraCoinDetails | null;
  metadata: HotdogMetadata | null;
  attestationPeriod?: AttestationPeriod;
  duplicateOfLogId?: string | null;
  eaterProfile?: HotdogProfile | null;
  loggerProfile?: HotdogProfile | null;
}

export interface GetAllResponse {
  hotdogs: ProcessedHotdog[];
  validAttestations: string[];
  invalidAttestations: string[];
  userAttested: boolean[];
  userAttestations: boolean[];
  totalPages: number;
  hasNextPage: boolean;
  nextCursor?: number;
}

/** Response from hotdog.getAllForUser — profile dog lists. */
export interface GetAllForUserResponse {
  hotdogs: ProcessedHotdog[];
  validAttestations?: string[];
  invalidAttestations?: string[];
  totalPages: number;
  hasNextPage: boolean;
  nextCursor?: number;
}

export interface LeaderboardProfile {
  address: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  fid?: number | null;
  isKnownSpammer?: boolean | null;
  isReportedForSpam?: boolean | null;
  isDisqualified?: boolean | null;
}

export interface LeaderboardResponse {
  users: string[];
  hotdogs: string[];
  profiles: LeaderboardProfile[];
}

export interface LeaderboardEntry {
  address: string;
  count: string;
  rank: number;
  name: string;
  avatarUrl?: string | null;
  profile?: LeaderboardProfile | null;
}

export interface Session {
  address: string;
  sessionToken: string;
  fid?: number | null;
  username?: string | null;
  image?: string | null;
  name?: string | null;
}

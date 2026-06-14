export interface HotdogProfile {
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

export interface ZoraCoinDetails {
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  totalVolume: string;
  volume24h?: string;
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
}

export interface ProcessedHotdog {
  logId: string;
  imageUri: string;
  metadataUri: string;
  timestamp: string;
  eater: string;
  logger: string;
  zoraCoin: ZoraCoinDetails | null;
  metadata: { imageUri: string; eater: string; zoraCoin?: { address: string; name: string; symbol: string } } | null;
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
}

export interface LeaderboardEntry {
  address: string;
  count: string;
  profile?: HotdogProfile | null;
}

export interface Session {
  address: string;
  sessionToken: string;
  fid?: number | null;
  username?: string | null;
  image?: string | null;
  name?: string | null;
}

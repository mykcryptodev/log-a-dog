/**
 * Pure, framework-agnostic helpers for the hotdog feed. Extracted so the web and
 * mobile feeds derive per-card attestation state and leaderboard ticker items
 * from the same logic instead of duplicating it.
 */
import type {
  GetAllResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from "./types";
import { formatAddress } from "./format";

export interface AttestationMaps {
  validMap: Record<string, string>;
  invalidMap: Record<string, string>;
  userAttestedMap: Record<string, boolean>;
  userAttestationMap: Record<string, boolean>;
}

export interface AttestationData {
  validAttestations: string;
  invalidAttestations: string;
  userAttested: boolean;
  userAttestation: boolean;
}

const EMPTY_MAPS: AttestationMaps = {
  validMap: {},
  invalidMap: {},
  userAttestedMap: {},
  userAttestationMap: {},
};

/**
 * Build logId -> attestation lookup maps from one or more feed pages. Doing this
 * once per data change (instead of scanning arrays per card) keeps large feeds
 * cheap to re-render.
 */
export function buildAttestationMaps(
  pages: Array<Pick<
    GetAllResponse,
    | "hotdogs"
    | "validAttestations"
    | "invalidAttestations"
    | "userAttested"
    | "userAttestations"
  >>,
): AttestationMaps {
  if (!pages || pages.length === 0) return { ...EMPTY_MAPS };

  const maps: AttestationMaps = {
    validMap: {},
    invalidMap: {},
    userAttestedMap: {},
    userAttestationMap: {},
  };

  for (const page of pages) {
    page.hotdogs.forEach((hotdog, index) => {
      maps.validMap[hotdog.logId] = page.validAttestations?.[index] ?? "0";
      maps.invalidMap[hotdog.logId] = page.invalidAttestations?.[index] ?? "0";
      maps.userAttestedMap[hotdog.logId] = page.userAttested?.[index] ?? false;
      maps.userAttestationMap[hotdog.logId] =
        page.userAttestations?.[index] ?? false;
    });
  }

  return maps;
}

/** Look up a single hotdog's attestation state from prebuilt maps. */
export function getAttestationData(
  logId: string,
  maps: AttestationMaps,
): AttestationData {
  return {
    validAttestations: maps.validMap[logId] ?? "0",
    invalidAttestations: maps.invalidMap[logId] ?? "0",
    userAttested: maps.userAttestedMap[logId] ?? false,
    userAttestation: maps.userAttestationMap[logId] ?? false,
  };
}

/**
 * Highest numeric logId seen so far. Used to infer the next on-chain id for an
 * optimistic card so it can display "#<next>" before the real row indexes.
 */
export function inferNextLogIdBase(logIds: string[]): bigint {
  let max = 0n;
  for (const logId of logIds) {
    try {
      const id = BigInt(logId);
      if (id > max) max = id;
    } catch {
      // non-numeric — skip
    }
  }
  return max;
}

/**
 * Flatten leaderboard router output into ranked ticker/list entries used by the
 * scoreboard banner and leaderboard screens.
 */
export function toLeaderboardEntries(
  leaderboard: LeaderboardResponse | null | undefined,
  limit = 10,
): LeaderboardEntry[] {
  if (!leaderboard) return [];
  const users = leaderboard.users?.slice(0, limit) ?? [];
  const hotdogs = leaderboard.hotdogs ?? [];
  const profiles = leaderboard.profiles ?? [];

  return users.map((address, i) => {
    const profile = profiles[i];
    return {
      address,
      count: String(hotdogs[i] ?? "0"),
      rank: i + 1,
      name:
        profile?.name ?? profile?.username ?? formatAddress(address),
      avatarUrl: profile?.image,
      profile: profile ?? null,
    };
  });
}

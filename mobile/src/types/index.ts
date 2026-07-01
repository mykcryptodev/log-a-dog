/**
 * Domain types now live in the shared data layer (`@shared/types`) so the web
 * and mobile apps render the same shapes. Re-exported here to preserve existing
 * `~/types` import paths.
 */
export type {
  HotdogProfile,
  AttestationPeriod,
  ZoraCoinMediaContent,
  ZoraCoinDetails,
  HotdogMetadata,
  ProcessedHotdog,
  GetAllResponse,
  LeaderboardProfile,
  LeaderboardResponse,
  LeaderboardEntry,
  Session,
} from "@shared/types";

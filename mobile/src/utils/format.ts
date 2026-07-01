/**
 * Formatting helpers now live in the shared data layer (`@shared/format`) so the
 * web and mobile apps stay in sync. This module re-exports them to keep the
 * existing `~/utils/format` import paths working.
 */
export {
  formatTimestamp,
  formatAddress,
  formatStake,
  getDisplayName,
  isInAttestationWindow,
  getVotePct,
  convertIpfsToHttps,
  formatAbbreviatedFiat,
} from "@shared/format";

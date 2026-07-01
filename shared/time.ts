import { ATTESTATION_WINDOW_SECONDS } from "./constants";

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  expired: boolean;
  /** e.g. "5h 3m 12s" or "Expired". */
  label: string;
}

/**
 * Time left in an attestation/voting window for a log, given its unix-seconds
 * timestamp. Shared by web and mobile so both count down identically.
 */
export function getAttestationCountdown(
  timestamp: string | number,
  windowSeconds: number = ATTESTATION_WINDOW_SECONDS,
  now: number = Math.floor(Date.now() / 1000),
): Countdown {
  const end = Number(timestamp) + windowSeconds;
  const diff = end - now;

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      expired: true,
      label: "Expired",
    };
  }

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds: diff,
    expired: false,
    label: `${hours}h ${minutes}m ${seconds}s`,
  };
}

/**
 * Whether a log is still inside its voting window and not yet resolved — the
 * shared predicate the judge queues on web and mobile use.
 */
export function isJudgeable(
  timestamp: string | number,
  attestationStatus: number | undefined,
  windowSeconds: number = ATTESTATION_WINDOW_SECONDS,
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  const open = !getAttestationCountdown(timestamp, windowSeconds, now).expired;
  const unresolved = attestationStatus !== 1;
  return open && unresolved;
}

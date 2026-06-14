import { CONTEST_START_TIME, CONTEST_END_TIME } from "~/constants";

// The current competitive season. Season 2 wrapped up before the contest
// window was re-opened on CONTEST_START_TIME, so the live window is Season 3.
export const CURRENT_SEASON = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SeasonInfo = {
  season: number;
  /** 1-indexed day number within the current contest window. */
  day: number;
  /** Whether the contest window is currently open. */
  isLive: boolean;
};

/**
 * Derive the season + day-of-season for the scoreboard header. Day is clamped
 * to the contest window so it never reads before day 1 or past the finale.
 */
export function getSeasonInfo(now: Date = new Date()): SeasonInfo {
  const start = new Date(CONTEST_START_TIME).getTime();
  const end = new Date(CONTEST_END_TIME).getTime();
  const t = now.getTime();

  const isLive = t >= start && t <= end;
  const elapsed = Math.floor((Math.min(Math.max(t, start), end) - start) / MS_PER_DAY);

  return {
    season: CURRENT_SEASON,
    day: elapsed + 1,
    isLive,
  };
}

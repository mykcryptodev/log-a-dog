// Season logic lives in the shared data layer so web + mobile compute the
// scoreboard header identically. Re-exported to keep `~/helpers/season`
// import paths working.
export { CURRENT_SEASON, getSeasonInfo, type SeasonInfo } from "@shared/season";

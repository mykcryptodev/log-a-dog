import PrizeWinnersSection from "~/components/PrizeWinnersSection";
import { HOTDOG_DAY_WINNERS } from "~/utils/hotdogDay";

export function HotdogDayWinners() {
  return (
    <PrizeWinnersSection
      title="🌭 NATIONAL HOTDOG DAY WINNERS"
      subtitle="$50 in $HOTDOG airdropped for logging a dog on National Hotdog Day"
      prizeLabel="$HOTDOG prize"
      entries={HOTDOG_DAY_WINNERS.map((winner) => ({
        logId: winner.logId,
        prizeUsd: winner.prizeUsd,
        caption: "National Hotdog Day winner",
      }))}
    />
  );
}

export default HotdogDayWinners;

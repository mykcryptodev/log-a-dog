import PrizeWinnersSection from "~/components/PrizeWinnersSection";
import { TOP_DOGS } from "~/utils/topDogs";

export function TopDogs() {
  return (
    <PrizeWinnersSection
      title="🥇 TOP DOGS"
      subtitle="$50 in $HOTDOG for the dog our weekly celebrity guest picks"
      prizeLabel="$HOTDOG prize"
      entries={TOP_DOGS.map((topDog) => ({
        logId: topDog.logId,
        prizeUsd: topDog.prizeUsd,
        caption: `Picked by ${topDog.pickedBy}`,
        tweetId: topDog.tweetId,
      }))}
    />
  );
}

export default TopDogs;

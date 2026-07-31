import PrizeWinnersSection from "~/components/PrizeWinnersSection";
import { POIDH_PRIZE_WINNERS } from "~/utils/poidh";

export function PoidhPrizeWinners() {
  return (
    <PrizeWinnersSection
      title="🕹️ POIDH PRIZE WINNERS"
      subtitle="$50 ETH daily bounty winners from the Fourth of July campaign"
      prizeLabel="ETH prize"
      link={{ href: "/poidh", label: "View POIDH campaign →" }}
      entries={POIDH_PRIZE_WINNERS.map((winner) => ({
        logId: winner.logId,
        prizeUsd: winner.prizeUsd,
        caption: "POIDH bounty winner",
      }))}
    />
  );
}

export default PoidhPrizeWinners;

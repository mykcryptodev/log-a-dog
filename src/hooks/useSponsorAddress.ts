import { env } from "~/env";
import { DEFAULT_CHAIN } from "~/constants/chains";
import { api } from "~/utils/api";

/**
 * Address of the EOA that relays sponsored logs.
 *
 * Every dog is logged through the relay now, so this address is the `logger` on
 * essentially every row in the feed — getting it wrong means every card sports a
 * "via 0x1234…" byline crediting a piece of plumbing.
 *
 * `NEXT_PUBLIC_LOGADOG_SPONSOR_ADDRESS` answers it with no request at all, but
 * forgetting to set it shouldn't break the feed, so fall back to asking the
 * server (which derives the address from the sponsor key it actually signs
 * with). React Query dedupes this across every card on the page.
 */
export function useSponsorAddress(): string | undefined {
  const configured = env.NEXT_PUBLIC_LOGADOG_SPONSOR_ADDRESS;

  const { data } = api.hotdog.getGaslessLoggingStatus.useQuery(
    { chainId: DEFAULT_CHAIN.id },
    { enabled: !configured, staleTime: Infinity },
  );

  return configured ?? data?.sponsor ?? undefined;
}

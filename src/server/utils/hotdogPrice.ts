import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "thirdweb/chains";

import { HOTDOG_TOKEN } from "~/constants/addresses";
import { CACHE_DURATION, getOrSetCache } from "~/server/utils/redis";

// Shape we persist in Redis. BigInt is not JSON-serializable, so the cached
// values are kept as strings and re-hydrated on read.
interface CachedHotdogPrice {
  priceUsd: number;
  marketCapMicroUsd: string;
  totalSupplyWei: string;
}

export interface HotdogPrice {
  /** USD price of one whole $HOTDOG token. */
  priceUsd: number;
  /** Market cap expressed in micro-dollars (USD * 1e6) for integer math. */
  marketCapMicroUsd: bigint;
  /** Raw on-chain total supply (18 decimals). */
  totalSupplyWei: bigint;
}

/**
 * Look up the current $HOTDOG price from Zora.
 *
 * Zora reports `marketCap` in USD and `totalSupply` as the raw on-chain value
 * (18 decimals), where internally `marketCap = pricePerToken * totalSupply / 1e18`.
 * So the price of one whole token is `marketCap / (totalSupply / 1e18)`.
 *
 * Cached briefly so a burst of analysis requests doesn't hammer the Zora API.
 */
export async function getHotdogPrice(chainId: number = base.id): Promise<HotdogPrice> {
  const cached = await getOrSetCache<CachedHotdogPrice>(
    `hotdog-price:${chainId}`,
    async () => {
      const address = HOTDOG_TOKEN[chainId];
      if (!address) {
        throw new Error(`$HOTDOG token not configured for chain ${chainId}`);
      }

      const response = await getCoin({ address, chain: chainId });
      const coin = response.data?.zora20Token;
      if (!coin?.marketCap || !coin?.totalSupply) {
        throw new Error("Unable to read $HOTDOG market data from Zora");
      }

      const marketCapUsd = Number(coin.marketCap);
      const totalSupplyWei = BigInt(coin.totalSupply);
      if (!(marketCapUsd > 0) || totalSupplyWei <= 0n) {
        throw new Error("Invalid $HOTDOG market data from Zora");
      }

      const priceUsd = marketCapUsd / (Number(totalSupplyWei) / 1e18);

      return {
        priceUsd,
        marketCapMicroUsd: BigInt(Math.round(marketCapUsd * 1e6)).toString(),
        totalSupplyWei: totalSupplyWei.toString(),
      } satisfies CachedHotdogPrice;
    },
    CACHE_DURATION.SHORT,
  );

  return {
    priceUsd: cached.priceUsd,
    marketCapMicroUsd: BigInt(cached.marketCapMicroUsd),
    totalSupplyWei: BigInt(cached.totalSupplyWei),
  };
}

/**
 * Convert a USDC amount (in base units, i.e. 6-decimal micro-dollars) into the
 * equivalent amount of $HOTDOG in wei, applying the payout multiplier.
 *
 * USDC base units are already micro-dollars, so:
 *   payoutMicroUsd = multiplier * usdcBaseUnits
 *   hotdogWei      = payoutMicroUsd * totalSupplyWei / marketCapMicroUsd
 * (totalSupplyWei is already in wei, so the result is in wei.)
 */
export function computeHotdogPayoutWei(
  usdcBaseUnits: bigint,
  multiplier: bigint,
  price: HotdogPrice,
): bigint {
  const payoutMicroUsd = multiplier * usdcBaseUnits;
  return (payoutMicroUsd * price.totalSupplyWei) / price.marketCapMicroUsd;
}

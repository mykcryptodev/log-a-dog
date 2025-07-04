import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { STAKING } from "~/constants/addresses";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { getContract, readContract } from "thirdweb";
import { client as serverClient } from "~/server/utils";
import { env } from "~/env";
import { formatEther } from "viem";
import { getOrSetCache, CACHE_DURATION } from "~/server/utils/redis";

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export const stakingRouter = createTRPCRouter({
  getApy: publicProcedure
    .input(z.object({ chainId: z.number() }))
    .query(async ({ input }) => {
      const { chainId } = input;
      const cacheKey = `staking:${chainId}:apy`;
      return getOrSetCache(cacheKey, async () => {
        const address = STAKING[chainId];
        const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
        if (!address || !chain) {
          throw new Error("Chain not supported");
        }
        const client = serverClient;
        const contract = getContract({ client, address, chain });
        const [totalStaked, rewardsPool, timeRemaining] = await Promise.all([
          readContract({ contract, method: "function totalStaked() view returns (uint256)" }),
          readContract({ contract, method: "function rewardsPool() view returns (uint256)" }),
          readContract({ contract, method: "function getTimeRemaining() view returns (uint256)" }),
        ]);
        if (timeRemaining === 0n) return 0;
        const emissionRate = Number(formatEther(rewardsPool)) / Number(timeRemaining);
        const yearlyRewards = emissionRate * SECONDS_PER_YEAR;
        const totalStakedNum = Number(formatEther(totalStaked));
        if (totalStakedNum === 0) return 0;
        return (yearlyRewards / totalStakedNum) * 100;
      }, CACHE_DURATION.SHORT);
    }),
});

import { z } from "zod";
import { PROFILES } from "~/constants/addresses";
import { createThirdwebClient, getContract } from "thirdweb";
import { readContract } from "thirdweb";
import { env } from "~/env";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getByAddress: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      address: z.string(),
    }))
    .query(async ({ input }) => {
      const { address, chainId } = input;
      const profileAddress = PROFILES[chainId];
      const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
      if (!profileAddress || !chain) {
        throw new Error("Chain not supported");
      }
      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });
      const contract = getContract({
        client,
        address: profileAddress,
        chain,
      });
      const result = await readContract({
        contract,
        method: {
          name: "profiles",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "address", type: "address" }],
          outputs: [
            { name: "username", type: "string" },
            { name: "imgUrl", type: "string" },
            { name: "metadata", type: "string" },
          ],
        },
        params: [address],
      });
      return {
        username: result[0],
        imgUrl: result[1],
        metadata: result[2],
      };
    }),
});
import { z } from "zod";
import { CONTESTS } from "~/constants/addresses";
import { createThirdwebClient, getContract } from "thirdweb";
import { readContract } from "thirdweb";
import { env } from "~/env";
import { SUPPORTED_CHAINS } from "~/constants/chains";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const contestRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const { id, chainId } = input;
      const contest = await getContest(id, chainId);
      return contest;
    }),
  getJoinRequests: publicProcedure
    .input(z.object({ 
      chainId: z.number(),
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const { id, chainId } = input;
      const contestAddress = CONTESTS[chainId];
      const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
      if (!contestAddress || !chain) {
        throw new Error("Chain not supported");
      }
      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });
      const contract = getContract({
        client,
        address: contestAddress,
        chain,
      });
      const joinRequests = await readContract({
        contract,
        method: {
          name: "getJoinRequests",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "contestId", type: "uint256" }],
          outputs: [{ name: "joinRequests", type: "address[]" }],
        },
        params: [BigInt(id)],
      });
      return joinRequests;
    }),
});

async function getContest (id: number, chainId: number) {
  const contestAddress = CONTESTS[chainId];
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  if (!contestAddress || !chain) {
    throw new Error("Chain not supported");
  }
  const client = createThirdwebClient({
    secretKey: env.THIRDWEB_SECRET_KEY,
  });
  const contract = getContract({
    client,
    address: contestAddress,
    chain,
  });
  const [contest, contestants] = await Promise.all([
    readContract({
      contract,
      method: {
        name: "contests",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "id", type: "uint256" }],
        outputs: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "metadata", type: "string" },
          { name: "startDate", type: "uint256" },
          { name: "endDate", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "isInviteOnly", type: "bool" },
        ],
      },
      params: [BigInt(id)],
    }),
    readContract({
      contract,
      method: {
        name: "getContestants",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "contestId", type: "uint256" }],
        outputs: [{ name: "contestants", type: "address[]" }],
      },
      params: [BigInt(id)],
    }),
  ]);
  return {
    id: contest[0].toString(),
    name: contest[1],
    metadata: contest[2],
    startDate: new Date(Number(contest[3])),
    endDate: new Date(Number(contest[4])),
    creator: contest[5],
    contestants,
    isInviteOnly: contest[6],
  };
}
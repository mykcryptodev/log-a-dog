import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { Engine } from "thirdweb";
import { client } from "~/server/utils";

export const engineRouter = createTRPCRouter({
  getTransactionStatus: publicProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ input }) => {
      const { transactionId } = input;
      const executionResult = await Engine.getTransactionStatus({
        client,
        transactionId,
      });
      
      return executionResult;
    }),
})
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getByAddress: publicProcedure
    .input(z.object({
      address: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { address } = input;
      const user = await ctx.db.user.findFirst({
        where: {
          address: address.toLowerCase(),
        },
        select: {
          fid: true,
        },
      });
      return user;
    }),
}); 
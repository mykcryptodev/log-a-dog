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
          username: true,
          image: true,
          name: true,
        },
      });
      return user;
    }),
  toggleNotifications: publicProcedure
    .input(z.object({
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { enabled } = input;
      // fetch the user and make sure they have an fid
      const user = await ctx.db.user.findFirst({
        where: {
          address: ctx.session?.user?.address?.toLowerCase(),
        },
        select: {
          fid: true,
          id: true,
        },
      });
      if (!user?.fid) {
        throw new Error("User not found or does not have a fid");
      }
      // update the user's notificationsEnabled field
      const updatedUser = await ctx.db.user.update({
        where: { id: user.id },
        data: { notificationsEnabled: enabled },
      });
      return updatedUser;
    }),
}); 
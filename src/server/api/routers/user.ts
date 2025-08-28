import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

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
          isKnownSpammer: true,
          isReportedForSpam: true,
          isDisqualified: true,
          username: true,
          image: true,
          name: true,
        },
      });
      return user;
    }),
  toggleNotifications: protectedProcedure
    .input(z.object({
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { enabled } = input;
      const userAddress = ctx.session.user.address;
      
      if (!userAddress) {
        throw new Error("User address not found in session");
      }
      
      // fetch the user and make sure they have an fid
      const user = await ctx.db.user.findFirst({
        where: {
          address: userAddress.toLowerCase(),
        },
        select: {
          fid: true,
          id: true,
        },
      });
      
      if (!user) {
        throw new Error("User not found");
      }
      
      if (!user.fid) {
        throw new Error("User does not have a Farcaster ID");
      }
      
      // update the user's notificationsEnabled field
      const updatedUser = await ctx.db.user.update({
        where: { id: user.id },
        data: { notificationsEnabled: enabled },
      });
      
      return {
        ...updatedUser,
        notificationsEnabled: enabled,
      };
    }),
  getNotificationState: publicProcedure
    .input(z.object({
      address: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { address } = input;
      
      if (!address) {
        return null;
      }
      
      const user = await ctx.db.user.findFirst({
        where: {
          address: address.toLowerCase(),
        },
        select: {
          notificationsEnabled: true,
        },
      });
      
      return user?.notificationsEnabled ?? false;
    }),
}); 
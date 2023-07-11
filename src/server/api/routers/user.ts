import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
    // get all users and sort by created date
    getAll: protectedProcedure.query(({ ctx }) => {
      return ctx.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),
    getByAddress: protectedProcedure
      .input(z.object({ address: z.string() }))
      .query(({ ctx, input }) => {
        return ctx.prisma.user.findMany({
          where: {
            address: {
              contains: input.address.toLowerCase(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          }
        });
      }),
    // get all admins
    getAdmins: publicProcedure.query(({ ctx }) => {
      return ctx.prisma.user.findMany({
        where: {
          isAdmin: true,
        },
        orderBy: {
          createdAt: 'desc',
        }
      });
    }),
    // get the users in a contest
    getByContest: protectedProcedure
      .input(z.object({ contestId: z.string().optional() }))
      .query(({ ctx, input }) => {
        if (!input.contestId) throw new Error('No contest ID provided');
        return ctx.prisma.userContest.findMany({
          where: {
            contestId: input.contestId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: true,
          },
        });
      }), 
    // allow users who are admins to update other users
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        isAdmin: z.boolean(),
      }))
      .mutation(({ ctx, input }) => {
        if (!ctx.session.user.isAdmin) throw new Error('You are not an admin');
        return ctx.prisma.user.update({
          where: {
            id: input.id,
          },
          data: {
            isAdmin: input.isAdmin,
          }
        });
      }),
  });
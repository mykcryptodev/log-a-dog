import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const contestRouter = createTRPCRouter({
  // create a contest
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string(),
      start: z.date(),
      end: z.date(),
      slug: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.contest.create({
        data: {
          name: input.name,
          description: input.description,
          start: input.start,
          end: input.end,
          slug: input.slug,
          createdBy: {
            connect: {
              id: ctx.session.user.id,
            },
          }
        },
      })
    }),
  // get all contests and sort by created date
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.contest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),
  // get a contest by its slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.contest.findUnique({
        where: {
          slug: input.slug,
        },
      });
    }),
  // find all contests that match a search query
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.contest.findMany({
        where: {
          OR: [
            {
              name: {
                contains: input.query,
              },
            },
            {
              description: {
                contains: input.query,
              },
            },
          ],
        },
      });
    }),
  // allow admins to delete contests
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      if (!ctx.session.user.isAdmin) throw new Error('You are not an admin');
      return ctx.prisma.contest.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
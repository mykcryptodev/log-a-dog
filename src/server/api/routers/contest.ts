import { z } from "zod";

import {
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
});
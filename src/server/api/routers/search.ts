import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const searchRouter = createTRPCRouter({
    // get all tags and sort by created date
    getItems: publicProcedure
      .input(z.object({
        query: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        if (!input.query) {
          return {
            profiles: [],
          }
        }
        // find all profiles whose name or address matches the query
        const profiles = await ctx.prisma.profile.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: input.query,
                }
              },
              {
                userId: {
                  contains: input.query,
                },
              }
            ],
          },
        });
        return {
          profiles,
        }
      }),
  });
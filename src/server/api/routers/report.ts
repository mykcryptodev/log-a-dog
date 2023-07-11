import { ReportStatus, ReportType } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const reportRouter = createTRPCRouter({
  // get by status
  getByStatus: publicProcedure
    .input(z.object({ 
      status: z.string(),
      take: z.number().optional(),
      skip: z.number().optional(),
    }))
    .query(({ input, ctx }) => {
      // if input is not a key of ReportStatus, it will throw an error
      if (!(input.status in ReportStatus)) {
        throw new Error("Invalid status");
      }
      return ctx.prisma.report.findMany({
        where: {
          status: ReportStatus[input.status as keyof typeof ReportStatus],
        },
        // include the profile
        include: {
          profile: true,
        },
        // optionally take and skip
        ...(input.take && { take: input.take }),
        ...(input.skip && { skip: input.skip }),
      });
    }),

  // get by contentId
  getByContentId: publicProcedure
    .input(z.object({
      contentId: z.string(),
      status: z.string().optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    }))
    .query(({ input, ctx }) => {
      // if status exists and it is not a valid status, throw an error
      if (input.status && !(input.status in ReportStatus)) {
        throw new Error("Invalid status");
      }
      return ctx.prisma.report.findMany({
        where: {
          contentId: input.contentId,
          // optionally filter on status
          ...(input.status && {
            status: ReportStatus[input.status as keyof typeof ReportStatus],
          }),
        },
        // include the profile
        include: {
          profile: true,
        },
        // optionally take and skip
        ...(input.take && { take: input.take }),
        ...(input.skip && { skip: input.skip }),
      });
    }),

  // allow admins to update report status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      if (!(input.status in ReportStatus)) {
        throw new Error("Invalid status");
      }
      // only admins can update report status
      if (!ctx.session.user?.isAdmin) {
        throw new Error("Unauthorized");
      }
      return ctx.prisma.report.update({
        where: {
          id: input.id,
        },
        data: {
          status: ReportStatus[input.status as keyof typeof ReportStatus],
        },
      });
    }),

  // allow anyone who is signed in to create a report
  create: protectedProcedure
    .input(z.object({
      contentId: z.string(),
      reason: z.string(),
      type: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      // if input is not a key of ReportType, it will throw an error
      if (!(input.type in ReportType)) {
        throw new Error("Invalid type");
      }
      return ctx.prisma.report.create({
        data: {
          contentId: input.contentId,
          reason: input.reason,
          status: ReportStatus.PENDING,
          type: ReportType[input.type as keyof typeof ReportType],
          createdBy: {
            connect: {
              id: ctx.session.user?.id,
            },
          },
          // if the type is profile, connect the profile
          ...(input.type === ReportType.PROFILE && {
            profile: {
              connect: {
                id: input.contentId,
              }
          }}),
        },
      });
    }),
});

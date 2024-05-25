import { createTRPCRouter } from "~/server/api/trpc";
import { attestationRouter } from "~/server/api/routers/attestation";
import { contestRouter } from "~/server/api/routers/contest";
import { hotdogRouter } from "~/server/api/routers/hotdog";
import { profileRouter } from "~/server/api/routers/profile";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  attestation: attestationRouter,
  contest: contestRouter,
  hotdog: hotdogRouter,
  profile: profileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

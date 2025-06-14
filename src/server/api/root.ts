import { createTRPCRouter } from "~/server/api/trpc";
import { attestationRouter } from "~/server/api/routers/attestation";
import { contestRouter } from "~/server/api/routers/contest";
import { engineRouter } from "~/server/api/routers/engine";
import { hotdogRouter } from "~/server/api/routers/hotdog";
import { profileRouter } from "~/server/api/routers/profile";
import { userRouter } from "~/server/api/routers/user";
import { warpcastRouter } from "~/server/api/routers/warpcast";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  attestation: attestationRouter,
  contest: contestRouter,
  engine: engineRouter,
  hotdog: hotdogRouter,
  profile: profileRouter,
  user: userRouter,
  warpcast: warpcastRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

import { profileRouter } from "~/server/api/routers/profile";
import { reportRouter } from "~/server/api/routers/report";
import { searchRouter } from "~/server/api/routers/search";
import { userRouter } from "~/server/api/routers/user";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  profile: profileRouter,
  report: reportRouter,
  search: searchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

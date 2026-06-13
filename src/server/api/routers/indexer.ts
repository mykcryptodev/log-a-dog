import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { redis } from "~/server/utils/redis";
import { indexChainEvents, indexAfterTransaction } from "~/server/utils/indexer";

// Per-identity cooldown for the manual/auto refresh path. The Redis index lock
// already coalesces concurrent scans; this stops a single client from issuing a
// fresh CDP scan on every click.
const REFRESH_COOLDOWN_SECONDS = 20;

function clientIdentity(ctx: {
  session: { user?: { id?: string; address?: string | null } } | null;
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const userId = ctx.session?.user?.id ?? ctx.session?.user?.address;
  if (userId) return `user:${userId}`;
  const fwd = ctx.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return `ip:${ip ?? "unknown"}`;
}

/**
 * Enforce a per-identity cooldown. Uses SET NX EX as an atomic
 * check-and-set so rapid concurrent clicks can't slip past.
 */
async function assertNotRateLimited(identity: string): Promise<void> {
  const key = `indexer:cooldown:${identity}`;
  const ok = await redis.set(key, Date.now(), {
    nx: true,
    ex: REFRESH_COOLDOWN_SECONDS,
  });
  if (!ok) {
    const ttl = await redis.ttl(key);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Please wait ${ttl > 0 ? ttl : REFRESH_COOLDOWN_SECONDS}s before refreshing again.`,
    });
  }
}

export const indexerRouter = createTRPCRouter({
  /**
   * Manual "Refresh feed" button, and the auto-trigger fired after a user logs
   * a dog. Rate-limited per identity. When `transactionHash` is supplied we wait
   * for that tx to be queryable in CDP before scanning, so the new log is
   * guaranteed to land in the feed.
   */
  refreshFeed: publicProcedure
    .input(
      z.object({
        chainId: z.number(),
        transactionHash: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertNotRateLimited(clientIdentity(ctx));

      const result = input.transactionHash
        ? await indexAfterTransaction(input.chainId, input.transactionHash)
        : await indexChainEvents(input.chainId);

      return result;
    }),
});

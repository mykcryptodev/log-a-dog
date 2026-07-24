import { z } from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { DEFAULT_CHAIN } from "~/constants";
import { getCelebrityPage } from "~/constants/celebrityPages";
import { sendTelegramMessage } from "~/lib/telegram";

function ipfsToHttp(uri: string): string {
  return uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri;
}

/** Resolve the display image for a dog: its onchain image, falling back to the
 * rendered OG card (which always exists for a real dog). */
function dogImageUrl(logId: string, imageUri: string | undefined): string {
  if (imageUri) return ipfsToHttp(imageUri);
  return `https://www.logadog.xyz/api/og/${logId}`;
}

export const celebrityRouter = createTRPCRouter({
  // Drives the /<slug> page: the 3 dogs (with images) and the pick if one has
  // already been made (in which case the page shows the locked winner).
  getPage: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const page = getCelebrityPage(input.slug);
      if (!page) return null;

      const logIds = page.dogs.map((d) => d.logId);
      const events = await db.dogEvent.findMany({
        where: { logId: { in: logIds }, chainId: DEFAULT_CHAIN.id.toString() },
        select: { logId: true, imageUri: true },
      });
      const imageByLogId = new Map(events.map((e) => [e.logId, e.imageUri]));

      const pick = await db.celebrityPick.findUnique({
        where: { slug: page.slug },
      });

      return {
        slug: page.slug,
        title: page.title,
        prizeUsd: page.prizeUsd,
        dogs: page.dogs.map((d) => ({
          logId: d.logId,
          name: d.name,
          imageUrl: dogImageUrl(d.logId, imageByLogId.get(d.logId)),
        })),
        pick: pick
          ? {
              pickedLogId: pick.pickedLogId,
              pickedDogName: pick.pickedDogName,
              createdAt: pick.createdAt,
            }
          : null,
      };
    }),

  // Records the celebrity's pick. Public + login-less (anyone with the link),
  // so this validates slug + dog against the config, and the DB unique on slug
  // makes the pick a one-time, race-free lock.
  pick: publicProcedure
    .input(z.object({ slug: z.string(), pickedLogId: z.string() }))
    .mutation(async ({ input }) => {
      const page = getCelebrityPage(input.slug);
      if (!page) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown page" });
      }
      const dog = page.dogs.find((d) => d.logId === input.pickedLogId);
      if (!dog) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid dog" });
      }

      try {
        await db.celebrityPick.create({
          data: {
            slug: page.slug,
            pickedLogId: dog.logId,
            pickedDogName: dog.name,
            prizeUsd: page.prizeUsd,
          },
        });
      } catch (err) {
        // Already picked — the @unique(slug) lock fired. First pick wins.
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          const existing = await db.celebrityPick.findUnique({
            where: { slug: page.slug },
          });
          return {
            status: "already_picked" as const,
            pickedLogId: existing?.pickedLogId ?? null,
            pickedDogName: existing?.pickedDogName ?? null,
          };
        }
        throw err;
      }

      // Alert myk. Non-fatal: a Telegram hiccup must not undo a saved pick.
      try {
        await sendTelegramMessage(
          `🐕 *${page.title}* picked *${dog.name}* on /${page.slug}\n` +
            `Prize: $${page.prizeUsd}\n` +
            `[View dog](https://logadog.xyz/dog/${dog.logId})`,
        );
      } catch (telegramError) {
        console.error("Celebrity pick: Telegram alert failed:", telegramError);
      }

      return {
        status: "picked" as const,
        pickedLogId: dog.logId,
        pickedDogName: dog.name,
      };
    }),
});

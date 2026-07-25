import { z } from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { DEFAULT_CHAIN } from "~/constants";
import { getCelebrityPage } from "~/constants/celebrityPages";
import { getEaterDescription } from "~/constants/eaterDescriptions";
import { fetchFarcasterByAddresses } from "~/lib/neynar";
import { getCachedProfile } from "~/server/utils/profile";
import { sendDiscordMessage } from "~/lib/discord";

function ipfsToHttp(uri: string): string {
  return uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Return the stored Farcaster snapshot for an eater, capturing it once (fresh
 * fetch) if we've never seen this address. After the first capture, every
 * celebrity page load reads this row — Farcaster is never hit per page load.
 * The first snapshot is kept as-is on races/re-captures (upsert update is a
 * no-op); refreshing a bio is a deliberate separate action.
 */
async function getOrCaptureEaterBio(address: string) {
  const key = address.toLowerCase();

  const existing = await db.eaterBio.findUnique({ where: { address: key } });
  if (existing) return existing;

  const fc = (await fetchFarcasterByAddresses([key])).get(key);
  const data = fc
    ? {
        address: key,
        fid: fc.fid,
        name: fc.displayName || fc.username || shortAddress(key),
        avatarUrl: fc.pfpUrl,
        bio: fc.bio,
      }
    : await (async () => {
        // No Farcaster account → no bio. Snapshot name/avatar from the eater's
        // other profile sources so they still render, and don't refetch later.
        const profile = await getCachedProfile(key, DEFAULT_CHAIN.id);
        return {
          address: key,
          fid: null,
          name: profile.username || shortAddress(key),
          avatarUrl: profile.imgUrl,
          bio: "",
        };
      })();

  return db.eaterBio.upsert({
    where: { address: key },
    create: data,
    update: {},
  });
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
        select: { logId: true, imageUri: true, eater: true },
      });
      const eventByLogId = new Map(events.map((e) => [e.logId, e]));

      // Each dog's eater: a stored Farcaster snapshot (captured once, then
      // served from the DB — no per-load fetch) plus a reusable description
      // from config.
      const resolveEater = async (logId: string) => {
        const address = eventByLogId.get(logId)?.eater;
        if (!address) return null;

        const snapshot = await getOrCaptureEaterBio(address);
        const bio = snapshot.bio.trim();
        return {
          name: snapshot.name || shortAddress(address),
          avatarUrl: snapshot.avatarUrl,
          bio: bio.length > 0 ? bio : null,
          description: getEaterDescription(address),
        };
      };

      const dogs = await Promise.all(
        page.dogs.map(async (d) => ({
          logId: d.logId,
          name: d.name,
          imageUrl: dogImageUrl(d.logId, eventByLogId.get(d.logId)?.imageUri),
          eater: await resolveEater(d.logId),
        })),
      );

      const pick = await db.celebrityPick.findUnique({
        where: { slug: page.slug },
      });

      return {
        slug: page.slug,
        title: page.title,
        prizeUsd: page.prizeUsd,
        dogs,
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

      // Alert the celebrity-pick Discord channel so the eater's prize airdrop
      // can be proposed there. Non-fatal: an alert hiccup must not undo a saved
      // pick.
      try {
        const event = await db.dogEvent.findFirst({
          where: { logId: dog.logId, chainId: DEFAULT_CHAIN.id.toString() },
          select: { eater: true },
        });
        const eaterAddress = event?.eater ?? null;
        let eaterName = eaterAddress ? shortAddress(eaterAddress) : "unknown";
        if (eaterAddress) {
          const snapshot = await getOrCaptureEaterBio(eaterAddress);
          if (snapshot.name) eaterName = snapshot.name;
        }
        await sendDiscordMessage(
          `🐕 **${page.title}** picked **${dog.name}** on /${page.slug}\n` +
            `Prize: **$${page.prizeUsd} of HOTDOG** → eater **${eaterName}**` +
            (eaterAddress ? ` \`${eaterAddress}\`` : "") +
            `\nReply **"propose it"** to queue the airdrop. <https://logadog.xyz/dog/${dog.logId}>`,
        );
      } catch (alertError) {
        console.error("Celebrity pick: Discord alert failed:", alertError);
      }

      return {
        status: "picked" as const,
        pickedLogId: dog.logId,
        pickedDogName: dog.name,
      };
    }),
});

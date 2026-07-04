import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";
import { redis } from "~/server/utils/redis";
import { sendNotificationToFids } from "~/lib/neynar";
import { sendBaseNotification } from "~/lib/base-notifications";
import { sendTelegramMessage } from "~/lib/telegram";

/**
 * Daily engagement notification.
 *
 * Fires at noon Eastern Time and, only if at least one dog was logged in the
 * last 24 hours, notifies the community on both Farcaster (via Neynar) and the
 * Base App with a call to action to open the app and judge the logged dogs.
 *
 * Scheduling / DST: Vercel crons run in UTC with no DST awareness. We schedule
 * this at both 16:00 and 17:00 UTC (noon ET in EDT and EST respectively) and
 * gate on the actual Eastern-time hour here, plus a Redis "already sent today"
 * guard so exactly one send happens per ET day regardless of DST.
 */

const TARGET_ET_HOUR = 12; // noon Eastern
const DEDUPE_TTL_SECONDS = 60 * 60 * 20; // 20h — comfortably past the next run

/** Returns { hour, dateKey } for the current time in America/New_York. */
function easternNow(): { hour: number; dateKey: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  // "24" can be emitted for midnight in some environments — normalise to 0.
  const rawHour = parseInt(get("hour"), 10);
  const hour = rawHour === 24 ? 0 : rawHour;
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;

  return { hour, dateKey };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const force = req.query.force === "true";

  try {
    const { hour, dateKey } = easternNow();

    // Only proceed at noon ET (bypass with ?force=true for manual testing).
    if (!force && hour !== TARGET_ET_HOUR) {
      return res.status(200).json({
        skipped: true,
        reason: `Not noon ET (current ET hour: ${hour})`,
      });
    }

    // Idempotency guard so the two UTC cron entries (and any retries) only
    // ever produce one send per ET day.
    const dedupeKey = `daily-notification:sent:${dateKey}`;
    if (!force) {
      // NX = only set if not present; returns null if it already existed.
      const acquired = await redis.set(dedupeKey, "1", {
        nx: true,
        ex: DEDUPE_TTL_SECONDS,
      });
      if (acquired === null) {
        return res.status(200).json({
          skipped: true,
          reason: `Already sent for ${dateKey}`,
        });
      }
    }

    // Count dogs logged in the last 24 hours. DogEvent.timestamp is the
    // on-chain event time in unix seconds.
    const cutoffSeconds = BigInt(Math.floor(Date.now() / 1000) - 24 * 60 * 60);
    const dogsLogged = await db.dogEvent.count({
      where: { timestamp: { gte: cutoffSeconds } },
    });

    if (dogsLogged === 0) {
      // Nothing happened today — release the guard so we don't block a future
      // manual/forced run, and send nothing.
      if (!force) {
        await redis.del(dedupeKey);
      }
      return res.status(200).json({
        skipped: true,
        reason: "No dogs logged in the last 24h",
        dogsLogged: 0,
      });
    }

    const dogWord = dogsLogged === 1 ? "dog" : "dogs";
    const title = "🌭 Time to judge!";
    const body = `${dogsLogged} ${dogWord} logged in the last 24h. Open Log a Dog to judge them and earn.`;
    const targetPath = "/";
    const targetUrl = "https://logadog.xyz/";

    // --- Farcaster: every unique FID in the user table ---
    const fidRows = await db.user.findMany({
      where: { fid: { not: null } },
      select: { fid: true },
      distinct: ["fid"],
    });
    const fids = fidRows
      .map((u) => u.fid)
      .filter((f): f is number => f !== null);

    const farcasterSubmitted = await sendNotificationToFids(fids, {
      title,
      body,
      target_url: targetUrl,
    });

    // --- Base App: every unique Ethereum address in the user table ---
    const addressRows = await db.user.findMany({
      where: { address: { not: null } },
      select: { address: true },
      distinct: ["address"],
    });
    const addresses = addressRows
      .map((u) => u.address)
      .filter((a): a is string => !!a);

    const baseResult = await sendBaseNotification({
      addresses,
      title,
      message: body,
      targetPath,
    });

    const summary = {
      dogsLogged,
      farcaster: {
        uniqueFids: fids.length,
        submitted: farcasterSubmitted,
      },
      base: {
        uniqueAddresses: addresses.length,
        attempted: baseResult.attempted,
        batches: baseResult.batches,
        success: baseResult.success,
        errors: baseResult.errors,
      },
    };

    console.log("[daily-notification] Sent:", JSON.stringify(summary));

    try {
      await sendTelegramMessage(
        `📣 Daily notification sent\n🌭 ${dogsLogged} ${dogWord} logged in last 24h\n🟣 Farcaster: ${farcasterSubmitted}/${fids.length} FIDs\n🔵 Base: ${baseResult.attempted}/${addresses.length} addresses`,
      );
    } catch (telegramError) {
      console.error(
        "[daily-notification] Telegram summary failed:",
        telegramError,
      );
    }

    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("[daily-notification] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

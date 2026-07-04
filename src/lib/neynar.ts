import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { env } from "~/env";
import { db } from "~/server/db";

const config = new Configuration({
  apiKey: env.NEYNAR_API_KEY,
});

export const neynarClient = new NeynarAPIClient(config);

/**
 * Sends a notification to all users who have notifications enabled
 * @param notification - The notification object with title, body, and target_url
 * @returns Promise<boolean> - Returns true if notification was sent successfully
 */
export async function sendNotificationToUsers(notification: {
  title: string;
  body: string;
  target_url: string;
}): Promise<boolean> {
  try {
    // Get all users with notifications enabled and valid FIDs
    const usersWithNotifications = await db.user.findMany({
      where: {
        notificationsEnabled: true,
        fid: { not: null },
      },
      select: {
        fid: true,
      },
    });

    if (usersWithNotifications.length === 0) {
      console.log("No users with notifications enabled found");
      return true; // Not an error, just no users to notify
    }

    // Extract FIDs from the users
    const targetFids = usersWithNotifications
      .map(user => user.fid)
      .filter((fid): fid is number => fid !== null);

    if (targetFids.length === 0) {
      console.log("No valid FIDs found for notification");
      return true;
    }

    console.log(`Sending notification to ${targetFids.length} users:`, notification);

    // Send notification using Neynar API
    const response = await neynarClient.publishFrameNotifications({
      targetFids,
      notification,
    });

    console.log("Notification sent successfully:", response);
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}

/**
 * Sends a notification to an explicit list of FIDs via Neynar.
 *
 * Neynar only actually delivers to FIDs that have a valid notification token
 * (i.e. added the mini app + enabled notifications); other FIDs are ignored.
 * FIDs are chunked to keep request bodies reasonable.
 *
 * @returns number of FIDs the request was submitted for
 */
export async function sendNotificationToFids(
  fids: number[],
  notification: { title: string; body: string; target_url: string },
): Promise<number> {
  const uniqueFids = Array.from(new Set(fids.filter((f) => Number.isFinite(f))));

  if (uniqueFids.length === 0) {
    console.log("No FIDs provided for notification");
    return 0;
  }

  const CHUNK_SIZE = 100;
  let submitted = 0;

  for (let i = 0; i < uniqueFids.length; i += CHUNK_SIZE) {
    const targetFids = uniqueFids.slice(i, i + CHUNK_SIZE);
    try {
      await neynarClient.publishFrameNotifications({ targetFids, notification });
      submitted += targetFids.length;
      console.log(
        `[neynar] Submitted notification for ${targetFids.length} FIDs`,
      );
    } catch (error) {
      console.error("[neynar] Error submitting notification chunk:", error);
    }
  }

  return submitted;
}
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
      .map((user: { fid: number | null }) => user.fid)
      .filter((fid: number | null): fid is number => fid !== null);

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
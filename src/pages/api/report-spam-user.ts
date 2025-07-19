import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { sendTelegramMessage } from "~/lib/telegram";
import { db } from "~/server/db";

const ReportSpamUserSchema = z.object({
  address: z.string().min(1, "Address is required"),
  reporterAddress: z.string().optional(), // Optional: who is reporting
  reason: z.string().optional(), // Optional: reason for report
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = ReportSpamUserSchema.parse(req.body);
    const { address, reporterAddress, reason } = body;

    // Update the user's spam flag in the database
    try {
      // First, try to find the user by address
      const existingUser = await db.user.findFirst({
        where: {
          address: address.toLowerCase(),
        },
      });

      if (existingUser) {
        // Update existing user
        await db.user.update({
          where: { id: existingUser.id },
          data: { isReportedForSpam: true },
        });
      } else {
        // Create new user record with the spam flag set
        await db.user.create({
          data: {
            address: address.toLowerCase(),
            isReportedForSpam: true,
          },
        });
      }
    } catch (dbError) {
      console.error("Error updating user spam flag:", dbError);
      // Continue with Telegram notification even if database update fails
    }

    // Create the profile URL
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://logadog.xyz'}/profile/address/${address}`;

    // Format the Telegram message
    let message = `🚨 **Spam User Report**\n\n`;
    message += `**Reported User:** \`${address}\`\n`;
    message += `**Profile:** [View Profile](${profileUrl})\n`;
    
    if (reporterAddress) {
      message += `**Reported By:** \`${reporterAddress}\`\n`;
    }
    
    if (reason) {
      message += `**Reason:** ${reason}\n`;
    }

    message += `\n**Action Required:** Please investigate this user for potential spam activity.`;

    // Send Telegram notification
    const telegramSent = await sendTelegramMessage(message);

    if (!telegramSent) {
      console.warn('Failed to send Telegram notification for spam report');
    }

    return res.status(200).json({
      success: true,
      message: "Spam report submitted successfully",
      telegramNotified: telegramSent,
    });
  } catch (error) {
    console.error("Error processing spam report:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
} 
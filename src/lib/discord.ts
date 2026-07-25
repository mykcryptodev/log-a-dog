import { env } from "~/env";

/**
 * Posts a message to the celebrity-pick Discord channel via webhook, if
 * configured. Used to alert on a celebrity pick so it can be actioned there
 * (e.g. proposing the eater's prize airdrop). No-op when the webhook is unset.
 */
export async function sendDiscordMessage(content: string): Promise<boolean> {
  const url = env.DISCORD_CELEBRITY_WEBHOOK_URL;
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      console.error("Failed to send Discord message:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending Discord message:", error);
    return false;
  }
}

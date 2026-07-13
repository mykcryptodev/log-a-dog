import { env } from "~/env";

interface TelegramMessage {
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
}

/**
 * Sends a message to Telegram if notifications are enabled
 */
export async function sendTelegramMessage(message: string): Promise<boolean> {
  // Check if Telegram notifications are enabled
  if (!env.TELEGRAM_NOTIFICATIONS_ENABLED || env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'true') {
    return false;
  }

  // Check if required environment variables are set
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn('Telegram notifications enabled but missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return false;
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload: TelegramMessage = {
      text: message,
      parse_mode: 'Markdown',
    };

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        ...payload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Telegram message:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

/**
 * Sends a photo with caption to Telegram if notifications are enabled
 */
export async function sendTelegramPhoto(photoUrl: string, caption: string): Promise<boolean> {
  if (!env.TELEGRAM_NOTIFICATIONS_ENABLED || env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'true') {
    return false;
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn('Telegram notifications enabled but missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return false;
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        photo: photoUrl,
        caption,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Telegram photo:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram photo:', error);
    return false;
  }
}

function ipfsToHttp(uri: string): string {
  return uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri;
}

/**
 * Formats a dog logging notification message
 */
export function formatDogLogMessage(dogEvent: { logId: string; userFid?: number | null; userName?: string | null }): string {
  const userInfo = dogEvent.userName ? `by @${dogEvent.userName}` : dogEvent.userFid ? `by FID ${dogEvent.userFid}` : '';
  return `🐕 New dog logged! ${userInfo}\n[View dog](https://logadog.xyz/dog/${dogEvent.logId})`;
}

/**
 * Sends a dog-log alert as a photo + caption, falling back to a text message
 * when there is no image or Telegram rejects the photo URL (e.g. oversized file
 * or a slow IPFS gateway).
 */
export async function sendDogLogAlert(dogEvent: {
  logId: string;
  imageUri?: string | null;
  userFid?: number | null;
  userName?: string | null;
}): Promise<boolean> {
  const caption = formatDogLogMessage(dogEvent);
  if (dogEvent.imageUri) {
    const sent = await sendTelegramPhoto(ipfsToHttp(dogEvent.imageUri), caption);
    if (sent) return true;
  }
  return sendTelegramMessage(caption);
}

/**
 * Formats a cron job completion message
 */
export function formatCronJobMessage(processed: number, skipped: number): string {
  return `⚡ Cron job completed!\n• Rewards processed: ${processed}\n• Skipped (window not passed): ${skipped}`;
}
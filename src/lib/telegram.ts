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
 * Formats a dog logging notification message
 */
export function formatDogLogMessage(dogEvent: { id: string; userFid?: number | null; userName?: string }): string {
  const userInfo = dogEvent.userName ? `by ${dogEvent.userName}` : dogEvent.userFid ? `by FID ${dogEvent.userFid}` : '';
  return `🐕 New dog logged! ${userInfo}\nEvent ID: ${dogEvent.id}`;
}

/**
 * Formats a cron job completion message
 */
export function formatCronJobMessage(processed: number, skipped: number): string {
  return `⚡ Cron job completed!\n• Rewards processed: ${processed}\n• Skipped (window not passed): ${skipped}`;
}
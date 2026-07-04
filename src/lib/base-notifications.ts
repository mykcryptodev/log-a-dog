import { env } from "~/env";

const BASE_NOTIFICATIONS_ENDPOINT =
  "https://dashboard.base.org/api/v1/notifications/send";

// The Base App only delivers to the URL the mini app is registered under.
const APP_URL = "https://logadog.xyz";

// The Base API accepts 1-1000 wallet addresses per request.
const MAX_ADDRESSES_PER_REQUEST = 1000;

export interface BaseNotificationResult {
  attempted: number;
  batches: number;
  success: boolean;
  errors: string[];
}

/**
 * Sends a push notification to Base App users by Ethereum wallet address.
 *
 * Only users who have pinned the mini app in the Base App and opted into
 * notifications will actually receive it — the API silently ignores the rest.
 *
 * @see https://docs.base.org/apps/technical-guides/base-notifications
 */
export async function sendBaseNotification({
  addresses,
  title,
  message,
  targetPath = "/",
}: {
  addresses: string[];
  title: string;
  message: string;
  targetPath?: string;
}): Promise<BaseNotificationResult> {
  const result: BaseNotificationResult = {
    attempted: 0,
    batches: 0,
    success: true,
    errors: [],
  };

  const apiKey = env.BASE_NOTIFICATIONS_API_KEY;
  if (!apiKey) {
    console.warn(
      "[base-notifications] BASE_NOTIFICATIONS_API_KEY not set; skipping Base notification send",
    );
    result.success = false;
    result.errors.push("BASE_NOTIFICATIONS_API_KEY not configured");
    return result;
  }

  // De-dupe + normalise addresses (Base matches on lowercase hex).
  const uniqueAddresses = Array.from(
    new Set(
      addresses
        .filter((a): a is string => !!a)
        .map((a) => a.toLowerCase().trim())
        .filter((a) => a.startsWith("0x")),
    ),
  );

  if (uniqueAddresses.length === 0) {
    console.log("[base-notifications] No addresses to notify");
    return result;
  }

  // Base caps title at 30 chars and message at 200 chars.
  const safeTitle = title.slice(0, 30);
  const safeMessage = message.slice(0, 200);

  for (
    let i = 0;
    i < uniqueAddresses.length;
    i += MAX_ADDRESSES_PER_REQUEST
  ) {
    const batch = uniqueAddresses.slice(i, i + MAX_ADDRESSES_PER_REQUEST);
    result.batches++;
    result.attempted += batch.length;

    try {
      const response = await fetch(BASE_NOTIFICATIONS_ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_url: APP_URL,
          wallet_addresses: batch,
          title: safeTitle,
          message: safeMessage,
          target_path: targetPath,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error(
          `[base-notifications] Batch ${result.batches} failed: ${response.status} ${text}`,
        );
        result.success = false;
        result.errors.push(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      } else {
        console.log(
          `[base-notifications] Batch ${result.batches} sent to ${batch.length} addresses`,
        );
      }
    } catch (error) {
      console.error(
        `[base-notifications] Batch ${result.batches} threw:`,
        error,
      );
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    // Base rate-limits notification endpoints to 20 req/min per IP; space
    // batches out to stay well under that.
    if (i + MAX_ADDRESSES_PER_REQUEST < uniqueAddresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 3500));
    }
  }

  return result;
}

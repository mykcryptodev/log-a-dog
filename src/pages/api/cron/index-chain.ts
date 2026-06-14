import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_CHAIN } from "~/constants/chains";
import { indexChainEvents } from "~/server/utils/indexer";

/**
 * Hourly safety-net indexer.
 *
 * The app indexes new logs on-demand (right after a user logs a dog, and via the
 * "Refresh feed" button). This cron is the backstop: it catches anything written
 * directly to the contract outside our app, or any on-demand run that failed.
 *
 * Schedule is configured in `vercel.json` (`0 * * * *`).
 */
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

  const streamProgress = req.query.progress === "1";

  try {
    if (streamProgress) {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      });
      res.write(`[cron/index-chain] starting chain ${DEFAULT_CHAIN.id}\n`);

      const result = await indexChainEvents(DEFAULT_CHAIN.id, {
        onProgress: (progress) => {
          res.write(
            `[${progress.percent.toFixed(1)}%] ${progress.message}\n`,
          );
        },
      });

      console.log("[cron/index-chain] result:", result);
      res.write(`[cron/index-chain] done ${JSON.stringify(result)}\n`);
      return res.end();
    }

    const result = await indexChainEvents(DEFAULT_CHAIN.id);
    console.log("[cron/index-chain] result:", result);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("[cron/index-chain] error:", error);
    if (streamProgress) {
      res.write(
        `[cron/index-chain] error ${
          error instanceof Error ? error.message : "Unknown error"
        }\n`,
      );
      return res.end();
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

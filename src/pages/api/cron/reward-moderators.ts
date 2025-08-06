import type { NextApiRequest, NextApiResponse } from "next";
import { getContract } from "thirdweb";
import { db } from "~/server/db";
import { client, serverWallet } from "~/server/utils";
import { ATTESTATION_MANAGER, ATTESTATION_WINDOW_SECONDS } from "~/constants";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { resolveAttestationPeriod, getAttestationPeriod } from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { sendTelegramMessage, formatCronJobMessage } from "~/lib/telegram";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is a cron request (Vercel sets this header)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Starting automated moderator reward process...");

    // Ensure database connection is established with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await db.$connect();
        console.log("Database connection established successfully");
        break;
      } catch (error) {
        retryCount++;
        console.log(`Database connection attempt ${retryCount} failed:`, error);
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
        }
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    // Find DogEvents that are eligible for moderator rewards
    // Using Supabase/database as the source of truth for which events need processing
    // Criteria:
    // 1. Created more than ATTESTATION_WINDOW_SECONDS ago (attestation window has passed)
    // 2. attestationValid is null (not yet processed by our system)
    const cutoffTime = new Date(Date.now() - ATTESTATION_WINDOW_SECONDS * 1000);
    
    const eligibleEvents = await db.dogEvent.findMany({
      where: {
        createdAt: {
          lt: cutoffTime
        },
        attestationValid: null
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 50 // Process in batches of 50 to avoid timeouts
    });

    console.log(`Found ${eligibleEvents.length} potentially eligible events`);

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        logId: string;
        status: "processed" | "skipped" | "error";
        reason?: string;
        transactionId?: string;
      }>
    };

    // Process each eligible event
    for (const event of eligibleEvents) {
      try {
        const chainId = parseInt(event.chainId);
        const logId = event.logId;

        // Get the contract instance
        const attestationContract = getContract({
          address: ATTESTATION_MANAGER[chainId]!,
          client,
          chain: SUPPORTED_CHAINS.find(chain => chain.id === chainId)!,
        });

        // Check if attestation period exists and validate eligibility on-chain
        let attestationPeriod;
        try {
          attestationPeriod = await getAttestationPeriod({
            contract: attestationContract,
            logId: BigInt(logId),
          });
        } catch (error) {
          // No attestation period exists for this log
          results.skipped++;
          results.details.push({
            logId,
            status: "skipped",
            reason: "No attestation period found"
          });
          continue;
        }

        // Destructure the attestation period tuple
        // [startTime, endTime, status, totalValidStake, totalInvalidStake, isValid]
        const [startTime, , status, totalValidStake, totalInvalidStake] = attestationPeriod;

        // Check if attestation period has ended and is still active
        const currentTime = Math.floor(Date.now() / 1000);
        const attestationEndTime = Number(startTime) + ATTESTATION_WINDOW_SECONDS;
        
        if (currentTime < attestationEndTime) {
          // Attestation period hasn't ended yet
          results.skipped++;
          results.details.push({
            logId,
            status: "skipped", 
            reason: "Attestation period still active"
          });
          continue;
        }

        // Check if already resolved on-chain (status: 0 = Active, 1 = Resolved)
        if (Number(status) === 1) {
          // Already resolved on-chain, skip (webhook will handle database update)
          results.skipped++;
          results.details.push({
            logId,
            status: "skipped",
            reason: "Already resolved on-chain"
          });
          continue;
        }

        console.log(`Processing logId ${logId} - Total stake: ${Number(totalValidStake) + Number(totalInvalidStake)}`);

        // Execute the reward transaction - webhook will handle database updates
        const transaction = resolveAttestationPeriod({
          contract: attestationContract,
          logId: BigInt(logId),
        });

        const { transactionId } = await serverWallet.enqueueTransaction({ transaction });

        results.processed++;
        results.details.push({
          logId,
          status: "processed",
          transactionId
        });

        console.log(`Successfully queued transaction for logId ${logId}, transaction: ${transactionId}`);
        console.log(`Database will be updated automatically via webhook when transaction is mined`);

        // Add a small delay between transactions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing event ${event.logId}:`, error);
        results.errors++;
        results.details.push({
          logId: event.logId,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    console.log(`Moderator reward process completed: ${results.processed} processed, ${results.skipped} skipped, ${results.errors} errors`);

    // Send Telegram notification for cron job completion
    // Only notify if some rewards were actually processed
    if (results.processed > 0) {
      try {
        const message = formatCronJobMessage(results.processed, results.skipped);
        await sendTelegramMessage(message);
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError);
        // Don't fail the cron job if Telegram fails
      }
    }

    // Explicitly disconnect from database
    await db.$disconnect();

    return res.status(200).json({
      success: true,
      summary: {
        totalEligible: eligibleEvents.length,
        processed: results.processed,
        skipped: results.skipped,
        errors: results.errors
      },
      details: results.details
    });

  } catch (error) {
    console.error("Error in moderator reward cron job:", error);
    
    // Ensure cleanup even on error
    try {
      await db.$disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting from database:", disconnectError);
    }
    
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
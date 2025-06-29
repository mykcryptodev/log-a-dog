import type { NextApiRequest, NextApiResponse } from "next";
import { getContract } from "thirdweb";
import { db } from "~/server/db";
import { client, serverWallet } from "~/server/utils";
import { ATTESTATION_MANAGER } from "~/constants/addresses";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { resolveAttestationPeriod, getAttestationPeriod } from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { deleteCachedData } from "~/server/utils/redis";

// Attestation window in seconds (3 minutes)
const ATTESTATION_WINDOW_SECONDS = 180;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is a cron request (Vercel sets this header)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Starting automated moderator reward process...");

    // Find DogEvents that are eligible for moderator rewards
    // Criteria:
    // 1. Created more than 3 minutes ago (attestation window has passed)
    // 2. attestationResolved is false or null (not yet processed)
    // 3. Has attestation activity (we'll verify this on-chain)
    const cutoffTime = new Date(Date.now() - ATTESTATION_WINDOW_SECONDS * 1000);
    
    const eligibleEvents = await db.dogEvent.findMany({
      where: {
        createdAt: {
          lt: cutoffTime
        },
        OR: [
          { attestationResolved: false },
          { attestationResolved: null }
        ]
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

        // Check if attestation period exists and is still active on-chain
        let attestationPeriod;
        try {
          attestationPeriod = await getAttestationPeriod({
            contract: attestationContract,
            logId: BigInt(logId),
          });
        } catch (error) {
          // No attestation period exists for this log
          await markAsProcessed(event.id, "No attestation period found");
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
        const [startTime, endTime, status, totalValidStake, totalInvalidStake, isValid] = attestationPeriod;

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
          // Already resolved on-chain, update our database
          await markAsProcessed(event.id, "Already resolved on-chain");
          results.skipped++;
          results.details.push({
            logId,
            status: "skipped",
            reason: "Already resolved on-chain"
          });
          continue;
        }

        // Check if there are any attestations to resolve
        const totalStake = Number(totalValidStake) + Number(totalInvalidStake);
        if (totalStake === 0) {
          // No stakes to resolve
          await markAsProcessed(event.id, "No stakes to resolve");
          results.skipped++;
          results.details.push({
            logId,
            status: "skipped",
            reason: "No stakes to resolve"
          });
          continue;
        }

        console.log(`Processing logId ${logId} - Total stake: ${totalStake}`);

        // Execute the reward transaction
        const transaction = resolveAttestationPeriod({
          contract: attestationContract,
          logId: BigInt(logId),
        });

        const { transactionId } = await serverWallet.enqueueTransaction({ transaction });

        // Update database to mark as processed
        await db.dogEvent.update({
          where: { id: event.id },
          data: {
            attestationResolved: true,
            attestationResolvedAt: new Date(),
            attestationTransactionHash: transactionId,
          }
        });

        // Invalidate Redis cache
        const hotdogPattern = `hotdogs:${chainId}:*`;
        const leaderboardPattern = `leaderboard:${chainId}:*`;
        await deleteCachedData(hotdogPattern);
        await deleteCachedData(leaderboardPattern);

        results.processed++;
        results.details.push({
          logId,
          status: "processed",
          transactionId
        });

        console.log(`Successfully processed logId ${logId}, transaction: ${transactionId}`);

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
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// Helper function to mark events as processed without rewards
async function markAsProcessed(eventId: string, reason: string) {
  await db.dogEvent.update({
    where: { id: eventId },
    data: {
      attestationResolved: true,
      attestationResolvedAt: new Date(),
    }
  });
  console.log(`Marked event ${eventId} as processed: ${reason}`);
}
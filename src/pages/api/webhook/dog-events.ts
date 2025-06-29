import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { db } from "~/server/db";

// Type for the result of processing each event
type EventProcessingResult = {
  success: boolean;
  id?: string;
  transactionHash?: string;
  skipped?: boolean;
  eventName?: string;
  duplicate?: boolean;
  error?: string;
};

// Define the schema for the webhook payload
const DogEventSchema = z.object({
  data: z.object({
    chain_id: z.string(),
    block_number: z.number(),
    block_hash: z.string(),
    block_timestamp: z.number(),
    transaction_hash: z.string(),
    transaction_index: z.number(),
    log_index: z.number(),
    address: z.string(),
    data: z.string(),
    topics: z.array(z.string()),
    decoded: z.object({
      name: z.string(),
      indexed_params: z.object({
        eater: z.string(),
        logId: z.string(),
        logger: z.string(),
      }),
      non_indexed_params: z.object({
        imageUri: z.string(),
        metadataUri: z.string(),
        timestamp: z.string(),
        zoraCoin: z.string(),
      }),
    }),
  }),
  status: z.string(),
  type: z.string(),
  id: z.string(),
});

const WebhookPayloadSchema = z.object({
  data: z.array(DogEventSchema),
  timestamp: z.number(),
  topic: z.string(),
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
    console.log("Received webhook payload:", JSON.stringify(req.body, null, 2));
    
    // Debug: Check if db and dogEvent are available
    console.log("Database client:", !!db);
    console.log("DogEvent model available:", !!db.dogEvent);
    
    // Parse and validate the webhook payload
    const payload = WebhookPayloadSchema.parse(req.body);
    console.log("Payload validated successfully");

    // Process each event in the payload
    const results: PromiseSettledResult<EventProcessingResult>[] = await Promise.allSettled(
      payload.data.map(async (event): Promise<EventProcessingResult> => {
        const eventData = event.data;
        const decoded = eventData.decoded;

        console.log(`Processing event: ${eventData.transaction_hash}`);

        try {
          // Check if this is a HotdogLogged event
          if (decoded.name !== "HotdogLogged") {
            console.log(`Skipping non-HotdogLogged event: ${decoded.name}`);
            return { success: true, skipped: true, eventName: decoded.name };
          }

          // Look up the user by eater address
          const eaterAddress = decoded.indexed_params.eater.toLowerCase();
          console.log(`Looking up user for eater address: ${eaterAddress}`);
          
          // First, let's check if ANY users exist with addresses
          const userCount = await db.user.count({
            where: {
              address: { not: null }
            }
          });
          console.log(`Total users with addresses: ${userCount}`);
          
          // Also check for case sensitivity issues
          const allUsersWithSimilarAddress = await db.user.findMany({
            where: {
              OR: [
                { address: eaterAddress },
                { address: decoded.indexed_params.eater },
                { address: { contains: eaterAddress.substring(2) } } // Check without 0x prefix
              ]
            },
            select: {
              id: true,
              address: true,
              fid: true,
            }
          });
          
          console.log(`Users with similar addresses: ${JSON.stringify(allUsersWithSimilarAddress)}`);
          
          const user = await db.user.findFirst({
            where: {
              address: eaterAddress,
            },
            select: {
              id: true,
              address: true,
              fid: true,
            },
          });
          
          if (user) {
            console.log(`Found user: ${user.id} with address: ${user.address} and FID: ${user.fid}`);
          } else {
            console.log(`No user found for address: ${eaterAddress}`);
            // Let's also check what addresses DO exist
            const sampleUsers = await db.user.findMany({
              where: { address: { not: null } },
              take: 3,
              select: { address: true }
            });
            console.log(`Sample user addresses in DB: ${JSON.stringify(sampleUsers)}`);
          }

          // Create or update the dog event
          // Using upsert to handle potential race conditions
          const dogEvent = await db.dogEvent.upsert({
            where: {
              transactionHash: eventData.transaction_hash,
            },
            update: {
              // Update only the updatedAt timestamp in case of redelivery
              updatedAt: new Date(),
              // Also update userId in case user was created after the event
              userId: user?.id,
            },
            create: {
              // Blockchain data
              chainId: eventData.chain_id,
              transactionHash: eventData.transaction_hash,
              address: eventData.address,
              blockTimestamp: BigInt(eventData.block_timestamp),

              // Decoded event data
              logId: decoded.indexed_params.logId,
              logger: decoded.indexed_params.logger.toLowerCase(),
              eater: decoded.indexed_params.eater.toLowerCase(),
              imageUri: decoded.non_indexed_params.imageUri,
              metadataUri: decoded.non_indexed_params.metadataUri || "",
              timestamp: BigInt(decoded.non_indexed_params.timestamp),
              zoraCoin: decoded.non_indexed_params.zoraCoin,

              // Webhook metadata
              webhookId: event.id,

              // Link to user if found
              userId: user?.id,
            },
          });

          console.log(`Successfully processed event: ${dogEvent.id}`);
          return { success: true, id: dogEvent.id, transactionHash: eventData.transaction_hash };
        } catch (error) {
          console.error(`Error processing event ${eventData.transaction_hash}:`, error);
          
          // Handle unique constraint violations gracefully
          if (error instanceof Error && error.message.includes("Unique constraint")) {
            console.log(`Duplicate event detected for transaction: ${eventData.transaction_hash}`);
            return { success: true, duplicate: true, transactionHash: eventData.transaction_hash };
          }
          throw error;
        }
      })
    );

    // Count successful and failed operations
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Failed to process event ${index}:`, result.reason);
      }
    });

    console.log(`Webhook processing complete: ${successful} successful, ${failed} failed`);

    return res.status(200).json({
      success: true,
      message: `Processed ${successful} events successfully, ${failed} failed`,
      results: results.map((r) => 
        r.status === "fulfilled" ? r.value : { error: String(r.reason) }
      ),
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid payload format",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
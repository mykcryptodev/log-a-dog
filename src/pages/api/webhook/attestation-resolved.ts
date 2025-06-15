import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { db } from "~/server/db";

// Define the schema for the attestation resolution webhook payload
const AttestationResolvedEventSchema = z.object({
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
        logId: z.string(),
      }),
      non_indexed_params: z.object({
        isValid: z.boolean(),
        totalInvalidStake: z.string(),
        totalValidStake: z.string(),
      }),
    }),
  }),
  status: z.string(),
  type: z.string(),
  id: z.string(),
});

const WebhookPayloadSchema = z.object({
  data: z.array(AttestationResolvedEventSchema),
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
    console.log("Received attestation webhook payload:", JSON.stringify(req.body, null, 2));
    
    // Parse and validate the webhook payload
    const payload = WebhookPayloadSchema.parse(req.body);
    console.log("Attestation payload validated successfully");

    // Process each attestation resolution event
    const results = await Promise.allSettled(
      payload.data.map(async (event) => {
        const eventData = event.data;
        const decoded = eventData.decoded;

        console.log(`Processing attestation resolution for logId: ${decoded.indexed_params.logId}`);

        try {
          // Check if this is an AttestationPeriodResolved event
          if (decoded.name !== "AttestationPeriodResolved") {
            console.log(`Skipping non-AttestationPeriodResolved event: ${decoded.name}`);
            return { success: true, skipped: true, eventName: decoded.name };
          }

          // Find the corresponding DogEvent by logId
          const dogEvent = await (db as any).dogEvent.findFirst({
            where: {
              logId: decoded.indexed_params.logId,
            },
          });

          if (!dogEvent) {
            console.warn(`No DogEvent found for logId: ${decoded.indexed_params.logId}`);
            return { 
              success: false, 
              error: `No DogEvent found for logId: ${decoded.indexed_params.logId}`,
              logId: decoded.indexed_params.logId 
            };
          }

          // Update the DogEvent with attestation results
          const updatedDogEvent = await (db as any).dogEvent.update({
            where: {
              id: dogEvent.id,
            },
            data: {
              attestationResolved: true,
              attestationValid: decoded.non_indexed_params.isValid,
              attestationTotalValidStake: decoded.non_indexed_params.totalValidStake,
              attestationTotalInvalidStake: decoded.non_indexed_params.totalInvalidStake,
              attestationResolvedAt: new Date(eventData.block_timestamp * 1000),
              attestationTransactionHash: eventData.transaction_hash,
              updatedAt: new Date(),
            },
          });

          console.log(`Successfully updated attestation for DogEvent ${dogEvent.id} (logId: ${decoded.indexed_params.logId})`);
          return { 
            success: true, 
            id: updatedDogEvent.id, 
            logId: decoded.indexed_params.logId,
            isValid: decoded.non_indexed_params.isValid,
            transactionHash: eventData.transaction_hash 
          };
        } catch (error) {
          console.error(`Error processing attestation for logId ${decoded.indexed_params.logId}:`, error);
          throw error;
        }
      })
    );

    // Count successful and failed operations
    const successful = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;
    const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !(r.value as any).success)).length;
    const skipped = results.filter((r) => r.status === "fulfilled" && (r.value as any).skipped).length;

    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Failed to process attestation event ${index}:`, result.reason);
      } else if (result.status === "fulfilled" && !(result.value as any).success && !(result.value as any).skipped) {
        console.error(`Failed to process attestation event ${index}:`, (result.value as any).error);
      }
    });

    console.log(`Attestation webhook processing complete: ${successful} successful, ${failed} failed, ${skipped} skipped`);

    return res.status(200).json({
      success: true,
      message: `Processed ${successful} attestations successfully, ${failed} failed, ${skipped} skipped`,
      results: results.map((r) => 
        r.status === "fulfilled" ? r.value : { error: String(r.reason) }
      ),
    });
  } catch (error) {
    console.error("Attestation webhook processing error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid payload format",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
} 
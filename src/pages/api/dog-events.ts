import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getDogEvents, getDogEventStats } from "~/server/api/dog-events";

const QuerySchema = z.object({
  logger: z.string().optional(),
  eater: z.string().optional(),
  attestationStatus: z.enum(["valid", "invalid", "pending"]).optional(),
  take: z.string().transform(Number).optional(),
  skip: z.string().transform(Number).optional(),
  stats: z.string().transform(val => val === "true").optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const query = QuerySchema.parse(req.query);

    // If stats requested, return statistics
    if (query.stats) {
      const stats = await getDogEventStats();
      return res.status(200).json(stats);
    }

    // Build where clause based on query parameters
    const where: any = {};
    if (query.logger) where.logger = query.logger;
    if (query.eater) where.eater = query.eater;
    
    // Handle attestation status filtering
    if (query.attestationStatus) {
      if (query.attestationStatus === "valid") {
        where.attestationValid = true;
        where.attestationResolved = true;
      } else if (query.attestationStatus === "invalid") {
        where.attestationValid = false;
        where.attestationResolved = true;
      } else if (query.attestationStatus === "pending") {
        where.attestationResolved = false;
      }
    }

    // Fetch dog events with pagination
    const events = await getDogEvents({
      where,
      take: query.take ?? 20,
      skip: query.skip ?? 0,
    });

    // Convert BigInt to string for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      blockTimestamp: event.blockTimestamp.toString(),
      timestamp: event.timestamp.toString(),
    }));

    return res.status(200).json({
      success: true,
      data: serializedEvents,
      pagination: {
        take: query.take ?? 20,
        skip: query.skip ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dog events:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
} 
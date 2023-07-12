import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const geocodeRouter = createTRPCRouter({
    // reverse geocode lat and lng
    reverse: publicProcedure
      .input(z.object({
        lat: z.number(),
        lng: z.number(),
      }))
      .query(async ({ input }) => {
        if (!input.lat || !input.lng) {
          return {
            location: null,
          }
        }
        // find all profiles whose name or address matches the query
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${input.lat},${input.lng}&key=${process.env.GOOGLE_API_KEY || ""}`);
        type GeocodeResponse = {
          results: {
            formatted_address: string;
          }[];
          status: string;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await response.json() as GeocodeResponse;
        if (data.status === 'OK') {
          return {
            location: data?.results?.[0]?.formatted_address || null,
          }
        } else {
          throw new Error(`Geocode error: ${data.status}`);
        }
      }),
  });
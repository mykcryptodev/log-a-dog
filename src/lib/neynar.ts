import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { env } from "~/env";

const config = new Configuration({
  apiKey: env.NEYNAR_API_KEY,
});

export const neynarClient = new NeynarAPIClient(config);
import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from 'zod';
import { createHmac } from "crypto";
import { env } from '~/env';

// Define the schema for the request body
const requestBodySchema = z.object({
  created_at: z.number(),
  type: z.string(),
  data: z.object({
    object: z.string(),
    hash: z.string(),
    thread_hash: z.string(),
    parent_hash: z.string().nullable(),
    parent_url: z.string().url(),
    root_parent_url: z.string().url(),
    parent_author: z.object({
      fid: z.number().nullable(),
    }),
    author: z.object({
      object: z.string(),
      fid: z.number(),
      custody_address: z.string(),
      username: z.string(),
      display_name: z.string(),
      pfp_url: z.string().url(),
      profile: z.object({
        bio: z.object({
          text: z.string(),
          mentioned_profiles: z.array(z.any()),
        }),
      }),
      follower_count: z.number(),
      following_count: z.number(),
      verifications: z.array(z.string()),
      verified_addresses: z.object({
        eth_addresses: z.array(z.string()),
        sol_addresses: z.array(z.string()),
      }),
      active_status: z.string(),
      power_badge: z.boolean(),
    }),
    text: z.string(),
    timestamp: z.string(),
    embeds: z.array(
      z.object({
        url: z.string().url(),
      })
    ),
    reactions: z.object({
      likes: z.array(z.any()),
      recasts: z.array(z.any()),
    }),
    replies: z.object({
      count: z.number(),
    }),
    mentioned_profiles: z.array(z.any()),
  }),
});

const makerUrl = `https://hook.us1.make.com/1wysoq8t7gwnhttw9kpxxvmv35ek57wk`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = JSON.stringify(req.body);

  const sig = req.headers['x-neynar-signature'];
  if (!sig) {
    return res.status(400).json({ error: "Neynar signature missing from request headers" });
  }

  const hmac = createHmac("sha512", env.NEYNAR_WEBHOOK_SECRET);
  hmac.update(body);

  const generatedSignature = hmac.digest("hex");

  const isValid = generatedSignature === sig;
  if (!isValid) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  if (req.method === 'POST') {
    try {
      // Validate and parse the request body
      const post = requestBodySchema.parse(req.body);
      // grab the first image posted
      const image = post.data.embeds[0]?.url;
      if (!image) return res.status(200).json({ message: "No image found in post" });

      // get this users address. default to the first verified ethereum address and fall back on the custody address
      const address = post.data.author.verified_addresses.eth_addresses[0] ?? post.data.author.custody_address;

      // send the image url to maker to decide if it is of someone eating a hotdog or not
      // this could be time intensive so we have another endpoint that receives the answer
      await fetch(makerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image, 
          recipientAddress: address,
          recipientImage: post.data.author.pfp_url,
          recipientAddressUsername: post.data.author.username,
        }),
      });
      console.log(' fetched to maker ', { 
        image, 
        recipientAddress: address,
        recipientImage: post.data.author.pfp_url,
        recipientAddressUsername: post.data.author.username,
      });

      res.status(200).json({ message: 'Success' });
    } catch (error) {
      res.status(400).json({ error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

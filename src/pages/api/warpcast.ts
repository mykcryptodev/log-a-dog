import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from 'zod';
import { createHmac } from "crypto";
import { env } from '~/env';

// Define the schema for the request body
const requestBodySchema = z.object({
  data: z.object({
    text: z.string().optional(),
    author: z.object({
      custody_address: z.string(),
      pfp_url: z.string().url(),
      username: z.string(),
      verified_addresses: z.object({
        eth_addresses: z.array(z.string()),
      }),
    }),
    embeds: z.array(
      z.object({
        url: z.string().url(),
      })
    ),
  }),
});

const makerUrl = `https://hook.us1.make.com/1wysoq8t7gwnhttw9kpxxvmv35ek57wk`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('caught warpcast hook...');
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
    console.log('not a valid signature');
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  if (req.method === 'POST') {
    try {
      // Validate and parse the request body
      const post = requestBodySchema.parse(req.body);
      console.log({ post: JSON.stringify(post) });

      // check to make sure that the text in the post contains $LOG or $log
      const text = post.data.text;
      if (!text) return res.status(200).json({ message: "No text found in post" });
      // check the text for the $LOG or $log
      if (!text.includes('$LOG') && !text.includes('$log')) return res.status(200).json({ message: "No $LOG or $log found in post" });

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

import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from 'zod';
import { createHmac } from "crypto";
import { env } from '~/env';

// Define the schema for the request body
const requestBodySchema = z.object({
  data: z.object({
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
      // grab the first image posted
      const image = post.data.embeds[0]?.url;
      if (!image) return res.status(200).json({ message: "No image found in post" });

      // check that the image is an image
      const isImage = image.match(/\.(jpeg|jpg|gif|png)$/) != null;
      if (!isImage) return res.status(200).json({ message: "Not an image" });

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

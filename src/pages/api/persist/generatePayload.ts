import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from "zod";
import { env } from "~/env";
import { createAuth } from 'thirdweb/auth';
import { createThirdwebClient } from "thirdweb";
import { privateKeyAccount } from "thirdweb/wallets";

const client = createThirdwebClient({
  secretKey: env.THIRDWEB_SECRET_KEY,
});

const adminAccount = privateKeyAccount({
  client,
  privateKey: env.THIRDWEB_PRIVATE_KEY,
});

const auth = createAuth({
  client,
  adminAccount,
  domain: env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
});

const generatePayloadSchema = z.object({
  address: z.string(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  console.log({ body: JSON.stringify(req.body) });

  try {
    const parsedData = generatePayloadSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }
    const payload = await auth.generatePayload({ 
      address: parsedData.data.address,
    });
    res.status(200).json(payload);
  } catch (error) {
    res.status(400).json({ error });
  }
}

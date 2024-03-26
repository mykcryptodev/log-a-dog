import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from "zod";
import { env } from "~/env";
import { createAuth } from 'thirdweb/auth';
import { createThirdwebClient } from "thirdweb";
import { issueUserToken } from "@coinbase/waas-server-auth";
import { privateKeyAccount } from "thirdweb/wallets";

const apiKeyName = env.COINBASE_API_KEY;
const privateKey = env.COINBASE_PRIVATE_KEY;

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

export default async function retrieveToken(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const schema = z.object({
    jwt: z.string(),
    userId: z.string(),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { jwt, userId } = validationResult.data;

  if (!jwt) {
    return res.status(400).json({ error: 'No jwt' });
  }

  const { valid } = await auth.verifyJWT({ jwt });

  if (!valid) {
    return res.status(400).json({ error: 'Invalid jwt' });
  }

  const token = await issueUserToken({ apiKeyName, privateKey, userID: userId });

  return res.status(200).json({ token });
}

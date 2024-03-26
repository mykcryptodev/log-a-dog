import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from "zod";
import { env } from "~/env";
import { createAuth } from 'thirdweb/auth';
import { createThirdwebClient } from "thirdweb";
import { issueUserToken } from "@coinbase/waas-server-auth";
import { privateKeyAccount } from "thirdweb/wallets";
import cookie from 'cookie';

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

  const cookies = cookie.parse(req.headers.cookie ?? '');
  const jwt = cookies.logDogXyz;
  const userId = cookies.logDogUser;
  console.log({ jwt, userId });

  if (!jwt) {
    return res.status(400).json({ error: 'No jwt' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'No userId' });
  }

  const { valid } = await auth.verifyJWT({ jwt });

  if (!valid) {
    return res.status(400).json({ error: 'Invalid jwt' });
  }

  const token = await issueUserToken({ apiKeyName, privateKey, userID: userId });
  console.log({ token });

  return res.status(200).json({ token });
}

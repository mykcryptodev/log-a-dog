import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from "zod";
import { env } from "~/env";
import { createAuth, type VerifyLoginPayloadParams } from 'thirdweb/auth';
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

export default async function generateJwt(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const schema = z.object({
    payload: z.custom<VerifyLoginPayloadParams>().optional(),
    userId: z.string(),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { payload, userId } = validationResult.data;

  if (!payload) {
    return res.status(400).json({ error: 'No payload' });
  }

  const verifiedPayload = await auth.verifyPayload(payload);

  if (!verifiedPayload.valid) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const jwt = await auth.generateJWT({
    payload: verifiedPayload.payload
  });

  // set cookies
  const date = new Date();
  date.setDate(date.getDate() + 7); // Set expire date 7 days from now
  const cookieData = env.NODE_ENV === 'production' ? 'HttpOnly; Secure;' : '';
  res.setHeader('Set-Cookie', [
    `logDogXyz=${jwt}; Expires=${date.toUTCString()}; Path=/; ${cookieData} SameSite=Strict`,
    `logDogUser=${userId}; Expires=${date.toUTCString()}; Path=/; ${cookieData} SameSite=Strict`
  ]);

  return res.status(200).json({ jwt });
}

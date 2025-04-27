import { type NextApiRequest, type NextApiResponse } from 'next';
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { type Account, privateKeyToAccount } from 'thirdweb/wallets';
import { z } from 'zod';
import { LOG_A_DOG } from '~/constants/addresses';
import { SUPPORTED_CHAINS } from '~/constants/chains';
import { env } from '~/env';
import { attestHotdogLog } from '~/thirdweb/84532/0xd672307b4fefae064e4e59bfbfc1e24776f57a33';

// Define the schema for the request body
const requestBodySchema = z.object({
  logId: z.string(),
  judgement: z.boolean(),
  chainId: z.number(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Validate and parse the request body
      const data = requestBodySchema.parse(req.body);

      console.log({ data })

      // if the request header x-secret doesnt match the MAKER_AFFIRM_SECRET env var, return 401
      if (req.headers['x-secret'] !== env.MAKER_AFFIRM_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log( ' secret passed! ');

      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const account = privateKeyToAccount({
        client,
        privateKey: env.ADMIN_PRIVATE_KEY,
      }) as unknown as Account;

      const chain = SUPPORTED_CHAINS.find((c) => c.id === data.chainId);
      if (!chain) {
        throw new Error("Chain not supported");
      }

      const attestation = attestHotdogLog({
        contract: getContract({
          address: LOG_A_DOG[data.chainId]!,
          client,
          chain,
        }),
        logId: BigInt(data.logId),
        isValid: data.judgement,
      });

      await sendTransaction({
        account,
        transaction: attestation,
      });
      res.status(200).json({ message: 'Success' });
    } catch (error) {
      console.log('error!', error);
      res.status(400).json({ error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

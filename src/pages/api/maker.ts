import { type NextApiRequest, type NextApiResponse } from 'next';
import { getContract, sendTransaction } from 'thirdweb';
import { client } from '~/server/utils';
import { type Account, privateKeyToAccount } from 'thirdweb/wallets';
import { z } from 'zod';
import { LOG_A_DOG } from '~/constants/addresses';
import { DEFAULT_CHAIN } from '~/constants/chains';
import { env } from '~/env';
import { logHotdog } from '~/thirdweb/84532/0xa8c9ecb6af528c69db3db340b3fe77888a39309c';
import { upload } from "thirdweb/storage";

// Define the schema for the request body
const requestBodySchema = z.object({
  image: z.string().url(),
  recipientAddress: z.string(),
  recipientUsername: z.string(),
  recipientImage: z.string(),
  hash: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      console.log(' maker responded ... ')
      // Validate and parse the request body
      const data = requestBodySchema.parse(req.body);

      // if the request header x-secret doesnt match the MAKER_AFFIRM_SECRET env var, return 401
      if (req.headers['x-secret'] !== env.MAKER_AFFIRM_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const account = privateKeyToAccount({
        client,
        privateKey: env.ADMIN_PRIVATE_KEY,
      }) as unknown as Account;

      let metadataUri = '';
      if (data.hash) {
        const ipfsHash = await upload({
          client,
          files: [{ farcasterHash: data.hash }],
        });
        metadataUri = ipfsHash;
      }

      const logDogTransaction = logHotdog({
        contract: getContract({
          client,
          address: LOG_A_DOG[DEFAULT_CHAIN.id]!,
          chain: DEFAULT_CHAIN,
        }),
        imageUri: data.image,
        metadataUri,
        eater: data.recipientAddress,
      });

      await sendTransaction({
        transaction: logDogTransaction,
        account,
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

import { EAS, SchemaEncoder, type TransactionSigner } from '@ethereum-attestation-service/eas-sdk';
import { type NextApiRequest, type NextApiResponse } from 'next';
import { createThirdwebClient, getContract, simulateTransaction } from 'thirdweb';
import { ethers6Adapter } from 'thirdweb/adapters/ethers6';
import { type Account, privateKeyToAccount } from 'thirdweb/wallets';
import { z } from 'zod';
import { PROFILES, EAS as EAS_ADDRESS, EAS_SCHEMA_ID } from '~/constants/addresses';
import { DEFAULT_CHAIN } from '~/constants/chains';
import { env } from '~/env';
import { profiles, setProfileOnBehalf } from '~/thirdweb/8453/0x2da5e4bba4e18f9a8f985651a846f64129459849';

const ENGINE_URL = `https://engine-production-3357.up.railway.app`;

// Define the schema for the request body
const requestBodySchema = z.object({
  image: z.string().url(),
  recipientAddress: z.string(),
  recipientUsername: z.string(),
  recipientImage: z.string(),
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

      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });

      const contract = getContract({
        client,
        address: PROFILES[DEFAULT_CHAIN.id]!,
        chain: DEFAULT_CHAIN,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const account = privateKeyToAccount({
        client,
        privateKey: env.ADMIN_PRIVATE_KEY,
      }) as unknown as Account;

      const profile = await profiles({
        contract,
        arg_0: data.recipientAddress,
      });

      if (profile[0] === "") {
        // create a profile on behalf of the user
        const transaction = setProfileOnBehalf({
          contract,
          address: data.recipientAddress,
          image: data.recipientImage,
          username: data.recipientUsername,
          metadata: '',
        });
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          await simulateTransaction({ transaction, account });
          const resp = void fetch(
            `${ENGINE_URL}/contract/${DEFAULT_CHAIN.id}/${contract.address}/write`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.ENGINE_ACCESS_TOKEN}`,
                "x-backend-wallet-address": `${env.BACKEND_PROFILE_WALLET_ADDRESS}`,
              },
              body: JSON.stringify({
                functionName: "setProfileOnBehalf",
                args: [
                  data.recipientAddress,
                  data.recipientUsername,
                  data.recipientImage,
                  "",
                ],
              }),
            },
          );
          console.log({ resp });
        } catch (e) {
          console.log('error in sim:', e);
        }
      }

      const signer = await ethers6Adapter.signer.toEthers({
        client,
        account,
        chain: DEFAULT_CHAIN,
      }) as TransactionSigner;
      
      const schemaUid = EAS_SCHEMA_ID[DEFAULT_CHAIN.id]!;

      const easContractAddress = EAS_ADDRESS[DEFAULT_CHAIN.id]!;
      const eas = new EAS(easContractAddress);
      eas.connect(signer);

      // create the attestation
      const schemaEncoder = new SchemaEncoder("string image_uri,string metadata");
      const encodedData = schemaEncoder.encodeData([
        { name: "image_uri", value: data.image, type: "string"},
        { name: "metadata", value: "", type: "string" }
      ]);
      await eas.attest({
        schema: schemaUid,
        data: {
          recipient: data.recipientAddress,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
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

import { EAS, SchemaEncoder, type TransactionSigner } from '@ethereum-attestation-service/eas-sdk';
import { type NextApiRequest, type NextApiResponse } from 'next';
import { createThirdwebClient } from 'thirdweb';
import { ethers6Adapter } from 'thirdweb/adapters/ethers6';
import { type Account, privateKeyToAccount } from 'thirdweb/wallets';
import { z } from 'zod';
import { EAS as EAS_ADDRESS, EAS_AFFIMRATION_SCHEMA_ID } from '~/constants/addresses';
import { SUPPORTED_CHAINS } from '~/constants/chains';
import { env } from '~/env';

// Define the schema for the request body
const requestBodySchema = z.object({
  attestationId: z.string(),
  recipientAddress: z.string(),
  judgement: z.boolean(),
  chainId: z.number(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Validate and parse the request body
      const data = requestBodySchema.parse(req.body);

      // if the request header x-secret doesnt match the MAKER_AFFIRM_SECRET env var, return 401
      if (req.headers['x-secret'] !== env.MAKER_AFFIRM_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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

      const signer = await ethers6Adapter.signer.toEthers({
        client,
        account,
        chain,
      }) as TransactionSigner;
      
      const affirmSchemaUid = EAS_AFFIMRATION_SCHEMA_ID[data.chainId];
      const easContractAddress = EAS_ADDRESS[data.chainId];
      if (!affirmSchemaUid || !easContractAddress) {
        throw new Error("Chain not supported");
      }
      const eas = new EAS(easContractAddress);
      eas.connect(signer);

      // create the judgement
      const judgementSchemaEncoder = new SchemaEncoder("bool isAffirmed");
      const encodedJudgementData = judgementSchemaEncoder.encodeData([
        { name: "isAffirmed", value: data.judgement, type: "bool" },
      ]);
      void eas.attest({
        schema: affirmSchemaUid,
        data: {
          recipient: data.recipientAddress,
          expirationTime: BigInt(0),
          revocable: true,
          refUID: data.attestationId,
          data: encodedJudgementData,
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

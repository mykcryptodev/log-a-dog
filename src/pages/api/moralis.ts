import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from 'zod';
import { env } from '~/env';
import web3 from 'web3';
import { SUPPORTED_CHAINS } from '~/constants/chains';
import { createThirdwebClient } from 'thirdweb';
import { ethers } from "ethers";
import { resolveScheme } from "thirdweb/storage";

const requestBodySchema = z.object({
  confirmed: z.boolean(),
  chainId: z.string(),
  abi: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      anonymous: z.boolean(),
      inputs: z.array(
        z.object({
          type: z.string(),
          name: z.string(),
          indexed: z.boolean(),
        })
      ),
    })
  ),
  streamId: z.string(),
  tag: z.string(),
  retries: z.number(),
  block: z.object({
    number: z.string(),
    hash: z.string(),
    timestamp: z.string(),
  }),
  logs: z.array(
    z.object({
      logIndex: z.string(),
      transactionHash: z.string(),
      address: z.string(),
      data: z.string(),
      topic0: z.string(),
      topic1: z.string(),
      topic2: z.string(),
      topic3: z.string(),
      triggered_by: z.array(z.string()),
    })
  ),
  txs: z.array(z.any()),
  txsInternal: z.array(z.any()),
  erc20Transfers: z.array(z.any()),
  erc20Approvals: z.array(z.any()),
  nftTokenApprovals: z.array(z.any()),
  nftApprovals: z.object({
    ERC721: z.array(z.any()),
    ERC1155: z.array(z.any()),
  }),
  nftTransfers: z.array(z.any()),
  nativeBalances: z.array(z.any()),
});

const makerUrl = `https://hook.us1.make.com/fndwprgmnrlwpqq0sjybx8vav5tvmp20`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providedSignature = req.headers["x-signature"];
  if (!providedSignature) throw new Error("Signature not provided");
  const generatedSignature = web3.utils.sha3(JSON.stringify(req.body)+env.MORALIS_SECRET_KEY);
  if (generatedSignature !== providedSignature) throw new Error("Invalid Signature");

  if (req.method === 'POST') {
    try {
      const webhook = requestBodySchema.parse(req.body);
      // TOODO: do this check
      // if (!webhook.confirmed) return res.status(200).json({ message: "Not confirmed" });

      const log = webhook.logs[0];
      if (!log) return res.status(200).json({ message: "No log found" });

      // Decode the log data
      const eventSignature = [
        "string",  // imageUri
        "string",  // metadataUri
        "uint256"  // timestamp
      ];
      const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(eventSignature, log.data);
      const [imgUri] = decodedData as unknown as [string];

      const logId = parseInt(log.topic1, 16).toString();

      const chainHex = webhook.chainId;
      const chainId = parseInt(chainHex, 16);
      
      const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
      if (!chain) {
        throw new Error("Chain not supported");
      }
      if (!imgUri) return res.status(200).json({ message: "No image found in attestation" });

      const client = createThirdwebClient({
        secretKey: env.THIRDWEB_SECRET_KEY,
      });

      let resolvedImgUrl;
      try {
        resolvedImgUrl = resolveScheme({
          client,
          uri: imgUri,
        });
      } catch (e) {
        if (imgUri.startsWith("ipfs://")) {
          resolvedImgUrl = `https://ipfs.io/ipfs/${imgUri.slice(7)}`;
        } else {
          resolvedImgUrl = imgUri;
        }
      }

      await fetch(makerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: resolvedImgUrl,
          logId,
          chainId,
        }),
      });

      res.status(200).json({ message: 'Success' });
    } catch (error) {
      console.log({ error });
      res.status(400).json({ error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

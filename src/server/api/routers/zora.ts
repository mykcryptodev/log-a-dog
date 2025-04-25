import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createCoin } from '@zoralabs/coins-sdk';
import { base, baseSepolia } from 'viem/chains';
import { createWalletClient, createPublicClient, http, type Address } from 'viem';
import { createThirdwebClient } from 'thirdweb';
import { upload } from 'thirdweb/storage';
import { env } from "~/env";

// Helper function to validate Chain type
const isChain = (value: unknown): value is typeof base | typeof baseSepolia => {
  return value === base || value === baseSepolia;
};

const createZoraCoinSchema = z.object({
  imageUri: z.string(),
  eater: z.string(),
  chain: z.any().refine(isChain, {
    message: "Invalid chain object",
  }),
});

export const zoraRouter = createTRPCRouter({
  createCoin: publicProcedure
    .input(createZoraCoinSchema)
    .mutation(async ({ input }) => {
      try {
        // Create metadata for the Zora Coin
        const metadata = {
          name: `Dog Log #${Date.now()}`,
          description: `A dog logged by ${input.eater}`,
          image: input.imageUri,
          properties: {
            eater: input.eater,
          }
        };

        // Upload metadata to IPFS
        const thirdwebClient = createThirdwebClient({
          secretKey: env.THIRDWEB_SECRET_KEY,
        });

        const metadataUri = await upload({
          client: thirdwebClient,
          files: [metadata],
        });

        // Create viem clients
        const publicClient = createPublicClient({
          chain: input.chain,
          transport: http(`https://${input.chain.id}.rpc.thirdweb.com/${env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`),
        });

        const walletClient = createWalletClient({
          account: env.ADMIN_PRIVATE_KEY as `0x${string}`,
          chain: input.chain,
          transport: http(`https://${input.chain.id}.rpc.thirdweb.com/${env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`),
        });

        // Create the Zora Coin
        const coin = await createCoin({
          name: `Log a Dog`,
          symbol: 'DOG',
          uri: metadataUri,
          payoutRecipient: input.eater as `0x${string}`,
          platformReferrer: walletClient.account.address,
        }, walletClient, publicClient);

        return {
          success: true,
          coin,
        };
      } catch (error) {
        console.error('Error creating Zora Coin:', error);
        throw new Error('Failed to create Zora Coin');
      }
    }),
}); 
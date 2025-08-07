import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { 
  DEFAULT_CHANNEL_ID,
  COMMENT_TYPE_COMMENT,
  EMPTY_PARENT_ID,
  COMMENT_MANAGER_ADDRESS
} from "@ecp.eth/sdk";
import { 
  createCommentData,
  createCommentTypedData
} from "@ecp.eth/sdk/comments";
import { type Hex, hashTypedData } from "viem";
import { privateKeyToAccount, signTypedData } from "viem/accounts";
import crypto from "crypto";
import { env } from "~/env";

// Server signing key for app signatures - should be stored securely
// This account signs on behalf of the app to enable gasless comments

export const commentsRouter = createTRPCRouter({
  /**
   * Prepare comment data for client-side signing
   * This creates the EIP-712 typed data that the client will sign
   */
  prepareComment: publicProcedure
    .input(
      z.object({
        author: z.string().startsWith("0x"),
        targetUri: z.string().url(),
        text: z.string().min(1),
        embeds: z.array(z.string()).optional(),
        parentId: z.string().optional(),
        chainId: z.number(),
        channelId: z.string().optional(),
        commentType: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate the app address from the private key to ensure they match
        const privateKey = `0x${env.ADMIN_PRIVATE_KEY}`;
        const appAccount = privateKeyToAccount(privateKey as Hex);
        
        // All comments are now root comments (no replies), so always use EMPTY_PARENT_ID
        const finalParentId = EMPTY_PARENT_ID;
        const targetUriForComment = input.targetUri;
        
        // Manually create comment data structure to avoid SDK overriding our parentId
        const commentData = {
          author: input.author as `0x${string}`,
          app: appAccount.address as `0x${string}`,
          channelId: BigInt(input.channelId || DEFAULT_CHANNEL_ID),
          deadline: BigInt(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          content: input.text,
          metadata: [] as any[],
          commentType: input.commentType || COMMENT_TYPE_COMMENT,
          targetUri: targetUriForComment,
          parentId: finalParentId as `0x${string}`,
        };

        // Get the correct chain ID and comment manager address
        const chainId = input.chainId;
        const commentsAddress = COMMENT_MANAGER_ADDRESS as `0x${string}`;

        // Create the EIP-712 typed data for signing
        const typedData = createCommentTypedData({
          commentData,
          chainId,
          commentsAddress,
        });

        // Calculate the hash of the typed data
        const hash = hashTypedData({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

        // Generate app signature on the server using the same private key
        const appSignature = await signTypedData({
          privateKey: privateKey as Hex,
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

        // Return the typed data for client signing along with app signature
        return {
          ...typedData,
          commentData,
          hash,
          appSignature,
        };
      } catch (error) {
        console.error("Error preparing comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to prepare comment data",
        });
      }
    }),

  /**
   * Submit a signed comment to the blockchain
   * This would be called after the client signs the typed data
   */
  submitSignedComment: publicProcedure
    .input(
      z.object({
        signature: z.string().startsWith("0x"),
        commentData: z.object({
          author: z.string(),
          targetUri: z.string(),
          text: z.string(),
          embeds: z.array(z.string()),
          parentId: z.string(),
          channelId: z.string(),
          commentType: z.number(),
          nonce: z.string(),
        }),
        chainId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // In production, you would:
        // 1. Verify the signature
        // 2. Submit the transaction to the blockchain
        // 3. Store the comment in your database for faster retrieval
        
        // For now, we'll just return success
        return {
          success: true,
          txHash: "0x" + crypto.randomBytes(32).toString('hex'), // Mock transaction hash
          commentId: "0x" + crypto.randomBytes(32).toString('hex'), // Mock comment ID
        };
      } catch (error) {
        console.error("Error submitting comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to submit comment",
        });
      }
    }),
});

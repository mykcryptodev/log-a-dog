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
import { type Hex, hashTypedData, keccak256, toBytes } from "viem";
import { privateKeyToAccount, signTypedData } from "viem/accounts";
import crypto from "crypto";
import { env } from "~/env";

// Server signing key for app signatures - should be stored securely
// This account signs on behalf of the app to enable gasless comments

// Helper function to convert comment ID to bytes32 format
function commentIdToBytes32(commentId: string): `0x${string}` {
  // If it's already a hex string with correct length (66 chars: 0x + 64 hex chars)
  if (commentId.startsWith('0x') && commentId.length === 66) {
    return commentId as `0x${string}`;
  }
  
  // If it's a hex string without 0x prefix and correct length (64 chars)
  if (!commentId.startsWith('0x') && commentId.length === 64 && /^[0-9a-fA-F]+$/.test(commentId)) {
    return `0x${commentId}` as `0x${string}`;
  }
  
  // Otherwise, hash the comment ID to get a bytes32 value
  return keccak256(toBytes(commentId));
}
// In production, APP_SIGNING_KEY should be set in environment variables

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
        
        console.log("App address from private key:", appAccount.address);
        console.log("BACKEND_WALLET_ADDRESS:", env.BACKEND_WALLET_ADDRESS);
        
        // Debug: Log the parentId value we received
        console.log("Input parentId:", input.parentId);
        console.log("EMPTY_PARENT_ID:", EMPTY_PARENT_ID);
        
        // Convert parentId to bytes32 format if provided, otherwise use EMPTY_PARENT_ID
        const finalParentId = input.parentId 
          ? commentIdToBytes32(input.parentId)
          : EMPTY_PARENT_ID;
        console.log("Final parentId to use:", finalParentId);
        
        // For replies, targetUri should be empty string, not the actual URI
        const isReply = input.parentId !== undefined && input.parentId !== null;
        const targetUriForComment = isReply ? "" : input.targetUri;
        
        console.log("Is reply:", isReply);
        console.log("Target URI for comment:", targetUriForComment);
        
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

        console.log("Manual commentData.parentId:", commentData.parentId);

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
        
        console.log("Generated app signature:", appSignature);
        console.log("Comment data app field:", commentData.app);
        console.log("TypedData message:", typedData.message);
        console.log("Address:", appAccount.address);

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

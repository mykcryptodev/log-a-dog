import { useState, useEffect, useMemo, useCallback } from "react";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { api } from "~/utils/api";
import { useActiveAccount } from "thirdweb/react";

import { COMMENT_MANAGER_ADDRESS, CommentManagerABI } from "@ecp.eth/sdk";
import { DEFAULT_CHAIN } from "~/constants";
import Image from "next/image";
import { getProxiedUrl } from "~/utils/imageProxy";
import { formatDistanceToNow } from "date-fns";
import { prepareContractCall, sendTransaction, waitForReceipt } from "thirdweb";
import { getContract } from "thirdweb";
import { base as thirdwebBase, baseSepolia as thirdwebBaseSepolia } from "thirdweb/chains";
import { client } from "~/providers/Thirdweb";

interface CustomCommentsProps {
  targetUri: string;
  logId: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    address: string;
    ens?: { name: string; avatarUrl?: string };
    farcaster?: { pfpUrl?: string };
  };
  createdAt: string;
  targetUri: string;
  txHash: string;
}

export const CustomComments: React.FC<CustomCommentsProps> = ({ targetUri, logId }) => {
  const account = useActiveAccount();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  // Mutations for comment operations
  const prepareCommentMutation = api.comments.prepareComment.useMutation();

  // Fetch comments using our GraphQL API endpoint
  const loadComments = useCallback(async (append = false, retries = 3) => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        targetUri,
        limit: "50",
      });
      
      if (append && cursor) {
        params.append("cursor", cursor);
      }

      const response = await fetch(`/api/comments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as {
        results: Comment[];
        pagination: {
          totalCount: number;
          hasNext: boolean;
          endCursor: string;
        };
      };

      if (append) {
        setComments(prev => [...prev, ...result.results]);
      } else {
        setComments(result.results);
      }
      
      setCursor(result.pagination.endCursor);
      setHasMore(result.pagination.hasNext);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetUri, account?.address, cursor]);

  // Load comments on mount and when account changes
  useEffect(() => {
    void loadComments();
  }, [targetUri, account?.address]);

  // Handle posting a new comment
  const handleSubmitComment = async () => {
    if (!account || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      // Step 1: Prepare the comment data for signing
      const preparedData = await prepareCommentMutation.mutateAsync({
        author: account.address,
        targetUri,
        text: newComment,
        chainId: DEFAULT_CHAIN.id,
      });

      // Step 2: Submit the comment to the blockchain using thirdweb
      // Using postComment method where user pays gas (simpler than gasless)
      const chain = DEFAULT_CHAIN.id === 8453 ? thirdwebBase : thirdwebBaseSepolia;
      
      const contract = getContract({
        client,
        chain,
        address: COMMENT_MANAGER_ADDRESS as `0x${string}`,
        abi: CommentManagerABI,
      });

      // Step 3: Prepare the transaction to post comment (user pays gas)
      const transaction = prepareContractCall({
        contract,
        method: "postComment",
        params: [
          preparedData.commentData,
          preparedData.appSignature, // Use the app signature from server
        ],
      });

      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      // Wait for confirmation
      const receipt = await waitForReceipt({
        client,
        chain,
        transactionHash: result.transactionHash,
      });

      // Clear the comment field and reload comments
      setNewComment("");
      
      // Wait for indexer to catch up, then reload comments with multiple attempts
      const checkForComment = async (attempt: number, maxAttempts = 6) => {
        await loadComments();
        
        if (attempt < maxAttempts) {
          setTimeout(() => {
            void checkForComment(attempt + 1, maxAttempts);
          }, attempt * 2000); // 2s, 4s, 6s, 8s, 10s, 12s
        }
      };
      
      void checkForComment(1);
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a single comment - all comments are flat, no nesting
  const renderComment = (comment: Comment) => {
    const authorDisplay = comment.author?.ens?.name || 
      (comment.author?.address ? `${comment.author.address.slice(0, 6)}...${comment.author.address.slice(-4)}` : "Anonymous");
    
    const avatarUrl = comment.author?.ens?.avatarUrl || comment.author?.farcaster?.pfpUrl;
    
    return (
      <div key={comment.id} className="p-4">
        <div className="flex items-start gap-3">
          {avatarUrl && (
            <Image
              src={getProxiedUrl(avatarUrl)}
              alt={authorDisplay}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          {!avatarUrl && (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
              {authorDisplay[0]?.toUpperCase()}
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{authorDisplay}</span>
              <span className="text-xs text-base-content/60">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Comment input */}
      {account && (
        <div className="mb-6 p-4 bg-base-100 rounded-lg border border-base-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
              {account.address[2]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="textarea textarea-bordered w-full min-h-[80px]"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-base-content/60">
                  Posting as {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="btn btn-primary btn-sm"
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Post Comment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!account && (
        <div className="mb-6 p-4 bg-base-200 rounded-lg text-center">
          <p className="text-sm text-base-content/70">Connect your wallet to join the conversation</p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading && comments.length === 0 ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <>
            {comments.map(comment => renderComment(comment))}
            
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => loadComments(true)}
                  disabled={isLoading}
                  className="btn btn-ghost btn-sm"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Load more comments"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomComments;

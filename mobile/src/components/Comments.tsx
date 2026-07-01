import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { getContract, prepareContractCall, sendTransaction, waitForReceipt } from "thirdweb";
import { base, baseSepolia } from "thirdweb/chains";
import { COMMENT_MANAGER_ADDRESS, CommentManagerABI } from "@ecp.eth/sdk";
import {
  dogCommentTargetUri,
  commentCreatedAtToUnixSeconds,
  type CommentItem,
  type CommentsPage,
} from "@shared/comments";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { API_URL, CHAIN_ID } from "~/constants";
import { COLORS } from "~/constants/colors";
import { formatAddress, formatTimestamp } from "@shared/format";
import { useActiveWallet, useActiveAccount } from "~/providers/WalletProvider";
import { useWallet } from "~/providers/WalletProvider";
import { trpc } from "~/utils/trpc";
import { getThirdwebClient } from "~/utils/thirdweb";

interface Props {
  logId: string;
}

export function Comments({ logId }: Props) {
  const targetUri = dogCommentTargetUri(logId);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connectExternalWallet } = useWallet();

  const prepareComment = trpc.comments.prepareComment.useMutation();
  const bustCache = trpc.comments.bustCache.useMutation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ targetUri, limit: "50" });
      const res = await fetch(`${API_URL}/api/comments?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as CommentsPage;
        setComments(json.results ?? []);
      }
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  }, [targetUri]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    let signer = wallet?.getAccount();
    if (!account?.address || !signer) {
      const connectedWallet = await connectExternalWallet();
      signer = connectedWallet?.getAccount();
    }
    if (!signer) {
      Alert.alert("Wallet required", "Connect a wallet to post comments on-chain.");
      return;
    }

    setSubmitting(true);
    try {
      const prepared = await prepareComment.mutateAsync({
        author: signer.address,
        targetUri,
        text: newComment.trim(),
        chainId: CHAIN_ID,
      });

      const chain = CHAIN_ID === 8453 ? base : baseSepolia;
      const client = getThirdwebClient();
      const contract = getContract({
        client,
        chain,
        address: COMMENT_MANAGER_ADDRESS,
        abi: CommentManagerABI,
      });

      const transaction = prepareContractCall({
        contract,
        method: "postComment",
        params: [prepared.commentData, prepared.appSignature],
      });

      const result = await sendTransaction({ transaction, account: signer });
      await waitForReceipt({ client, chain, transactionHash: result.transactionHash });

      setNewComment("");
      try {
        await bustCache.mutateAsync({ targetUri });
      } catch {
        // ignore
      }
      await load();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="px-4 pt-2 pb-8">
      <Text className="font-display text-neutral text-lg tracking-wide mb-3">
        💬 Comments
      </Text>

      {account && (
        <View className="bg-base-200 rounded-2xl p-3 mb-4">
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Share your thoughts..."
            multiline
            className="text-neutral text-sm min-h-[60px] mb-2"
            placeholderTextColor="#999"
          />
          <Pressable
            onPress={() => void submitComment()}
            disabled={submitting || !newComment.trim()}
            className="bg-primary rounded-xl py-2 items-center self-end px-6"
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.neutral} size="small" />
            ) : (
              <Text className="font-bold text-neutral text-sm">Post</Text>
            )}
          </Pressable>
        </View>
      )}

      {loading ? (
        <View className="py-8 items-center">
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : comments.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-3xl mb-2">💬</Text>
          <Text className="text-neutral/50 text-sm text-center">
            No comments yet. Be the first!
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {comments.map((c) => {
            const name =
              c.author?.ens?.name ?? formatAddress(c.author?.address);
            const avatar =
              c.author?.ens?.avatarUrl ?? c.author?.farcaster?.pfpUrl ?? null;
            return (
              <View key={c.id} className="flex-row gap-3">
                <ProfileAvatar
                  image={avatar}
                  address={c.author?.address}
                  size={36}
                />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold text-neutral text-sm" numberOfLines={1}>
                      {name}
                    </Text>
                    <Text className="text-neutral/40 text-xs">
                      {formatTimestamp(commentCreatedAtToUnixSeconds(c.createdAt))}
                    </Text>
                  </View>
                  <Text className="text-neutral/80 text-sm mt-0.5">{c.content}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

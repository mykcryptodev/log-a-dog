import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { API_URL } from "~/constants";
import { COLORS } from "~/constants/colors";
import { formatAddress, formatTimestamp } from "@shared/format";

interface CommentAuthor {
  address: string;
  ens?: { name?: string; avatarUrl?: string };
  farcaster?: { pfpUrl?: string };
}

interface CommentItem {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
}

interface Props {
  logId: string;
}

// Comments are posted on-chain from a user wallet (ECP.eth), which the mobile
// app doesn't hold — writes go through the server wallet. So mobile shows the
// conversation read-only and hands posting off to the web app.
export function Comments({ logId }: Props) {
  const targetUri = `https://logadog.xyz/dog/${logId}`;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ targetUri, limit: "50" });
      const res = await fetch(`${API_URL}/api/comments?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as { results?: CommentItem[] };
        setComments(json.results ?? []);
      }
    } catch {
      // network error — leave list empty
    } finally {
      setLoading(false);
    }
  }, [targetUri]);

  useEffect(() => {
    void load();
  }, [load]);

  const openWebToComment = () => {
    void WebBrowser.openBrowserAsync(`${API_URL}/dog/${logId}`);
  };

  const toUnixSeconds = (iso: string) =>
    String(Math.floor(new Date(iso).getTime() / 1000));

  return (
    <View className="px-4 pt-2 pb-8">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-display text-neutral text-lg tracking-wide">
          💬 Comments
        </Text>
        <Pressable onPress={openWebToComment} className="bg-base-200 rounded-full px-3 py-1.5">
          <Text className="text-neutral/70 text-xs font-bold">Add a comment</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="py-8 items-center">
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : comments.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-3xl mb-2">💬</Text>
          <Text className="text-neutral/50 text-sm text-center">
            No comments yet. Be the first to share your thoughts!
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
                      {formatTimestamp(toUnixSeconds(c.createdAt))}
                    </Text>
                  </View>
                  <Text className="text-neutral/80 text-sm mt-0.5">
                    {c.content}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "~/providers/AuthProvider";
import { trpc } from "~/utils/trpc";
import { HOTDOG_TOKEN } from "~/constants/addresses";
import { CHAIN_ID } from "~/constants";
import { COLORS } from "~/constants/colors";

const AVATAR_SIZE = 40;
const AVATAR_OVERLAP = 12;

export function RelevantHolders() {
  const { session } = useAuth();
  const router = useRouter();
  const fid = session?.fid;

  const { data, isLoading } = trpc.warpcast.getRelevantHolders.useQuery(
    {
      contractAddress: HOTDOG_TOKEN[CHAIN_ID]!,
      network: "base",
      viewerFid: fid ?? 0,
    },
    { enabled: !!fid, staleTime: 60_000 },
  );

  if (!fid) return null;
  if (isLoading) {
    return <View className="h-16 bg-base-200 rounded-xl mb-4 animate-pulse" />;
  }

  const holders = data?.top_relevant_fungible_owners_hydrated ?? [];
  if (holders.length === 0) return null;

  const visible = holders.slice(0, 6);
  const remaining = holders.length - visible.length;

  return (
    <View className="items-center bg-base-200 rounded-2xl px-4 py-4 mb-4">
      <View className="flex-row flex-wrap justify-center">
        {visible.map((h: any, i: number) => (
          <Pressable
            key={h.fid}
            onPress={() =>
              router.push(`/profile/address/${h.custody_address}`)
            }
            style={{
              marginLeft: i === 0 ? 0 : -AVATAR_OVERLAP,
              zIndex: visible.length - i,
            }}
          >
            <Image
              source={{ uri: h.pfp_url }}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                borderWidth: 2,
                borderColor: COLORS.base200,
              }}
            />
          </Pressable>
        ))}
        {remaining > 0 && (
          <View
            className="bg-neutral items-center justify-center"
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              borderWidth: 2,
              borderColor: COLORS.base200,
              marginLeft: -AVATAR_OVERLAP,
              zIndex: 0,
            }}
          >
            <Text className="text-white text-xs font-bold">+{remaining}</Text>
          </View>
        )}
      </View>
      <Text className="text-neutral/60 text-xs mt-2">Your friends have $HOTDOG!</Text>
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "~/providers/AuthProvider";
import { trpc } from "~/utils/trpc";
import { HOTDOG_TOKEN } from "~/constants/addresses";
import { CHAIN_ID } from "~/constants";

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
    <View className="items-center mb-4">
      <View className="flex-row">
        {visible.map((h) => (
          <Pressable
            key={h.fid}
            onPress={() =>
              router.push(`/profile/address/${h.custody_address}`)
            }
            className="-ml-2"
          >
            <Image
              source={{ uri: h.pfp_url }}
              style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#FFF8EC" }}
            />
          </Pressable>
        ))}
        {remaining > 0 && (
          <View className="w-10 h-10 rounded-full bg-neutral items-center justify-center -ml-2">
            <Text className="text-white text-xs font-bold">+{remaining}</Text>
          </View>
        )}
      </View>
      <Text className="text-neutral/60 text-xs mt-2">Your friends have $HOTDOG!</Text>
    </View>
  );
}

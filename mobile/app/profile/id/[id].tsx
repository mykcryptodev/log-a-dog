import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID } from "~/constants";
import { HotdogFeed } from "~/components/HotdogFeed";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { formatAddress } from "~/utils/format";

export default function ProfileByIdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: profile, isLoading } = trpc.profile.getById.useQuery(
    { chainId: CHAIN_ID, id: id ?? "" },
    { enabled: !!id },
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-base-100 items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const addr = profile?.address ?? "";
  const displayName =
    profile?.username ?? formatAddress(addr);

  const header = (
    <View className="px-4 pt-4 pb-2">
      <View className="flex-row items-center gap-3">
        <ProfileAvatar image={profile?.imgUrl} address={addr} size={64} />
        <View className="flex-1">
          <Text className="font-bold text-neutral text-lg" numberOfLines={1}>
            {displayName}
          </Text>
          {profile?.username ? (
            <Text className="text-neutral/50 text-sm">@{profile.username}</Text>
          ) : null}
          <Text className="text-neutral/40 text-xs font-mono">
            {formatAddress(addr)}
          </Text>
        </View>
      </View>
      <Text className="text-neutral/50 text-sm mt-4 mb-1 font-bold uppercase tracking-wider">
        Their dogs
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      {addr ? (
        <HotdogFeed userAddress={addr} header={header} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {header}
          <Text className="text-neutral/60 text-center mt-8">Profile not found.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

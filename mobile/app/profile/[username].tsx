import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID } from "~/constants";
import { HotdogFeed } from "~/components/HotdogFeed";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { formatAddress } from "~/utils/format";
import { isEthAddress } from "@shared/profile";

export default function UsernameProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const name = username ?? "";

  if (isEthAddress(name)) {
    router.replace(`/profile/address/${name.toLowerCase()}`);
    return null;
  }

  const { data: profile, isLoading } = trpc.profile.getByUsername.useQuery(
    { chainId: CHAIN_ID, username: name },
    { enabled: !!name },
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-base-100 items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const addr = profile?.address ?? "";
  const displayName = profile?.username ?? name;

  const header = (
    <View className="px-4 pt-4 pb-2">
      <View className="flex-row items-center gap-3">
        <ProfileAvatar image={profile?.imgUrl} address={addr} size={64} />
        <View className="flex-1">
          <Text className="font-bold text-neutral text-lg" numberOfLines={1}>
            @{displayName}
          </Text>
          {addr ? (
            <Text className="text-neutral/40 text-xs font-mono">
              {formatAddress(addr)}
            </Text>
          ) : null}
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

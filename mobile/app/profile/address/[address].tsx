import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID } from "~/constants";
import { HotdogFeed } from "~/components/HotdogFeed";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { formatAddress } from "~/utils/format";

interface UserProfile {
  username?: string;
  imgUrl?: string;
  address?: string;
}

export default function PublicProfileScreen() {
  const { address } = useLocalSearchParams<{ address: string }>();
  const addr = address ?? "";

  const { data: profile } = trpc.profile.getByAddress.useQuery(
    { chainId: CHAIN_ID, address: addr },
    { enabled: !!addr, refetchOnWindowFocus: false },
  );

  const p = profile as UserProfile | undefined;
  const name = p?.username ? p.username : formatAddress(addr);

  const header = (
    <View className="px-4 pt-4 pb-2">
      <View className="flex-row items-center gap-3">
        <ProfileAvatar image={p?.imgUrl} address={addr} size={64} />
        <View className="flex-1">
          <Text className="font-bold text-neutral text-lg" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-neutral/40 text-xs font-mono">
            {formatAddress(addr)}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            Linking.openURL(`https://www.logadog.xyz/profile/address/${addr}`)
          }
          className="bg-base-200 rounded-xl px-3 py-2"
        >
          <Text className="text-neutral/60 text-xs font-bold">Web ↗</Text>
        </Pressable>
      </View>
      <Text className="text-neutral/50 text-sm mt-4 mb-1 font-bold uppercase tracking-wider">
        Their dogs
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <HotdogFeed userAddress={addr} header={header} />
    </SafeAreaView>
  );
}

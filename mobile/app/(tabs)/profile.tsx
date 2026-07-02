import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "~/providers/AuthProvider";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { HotdogFeed } from "~/components/HotdogFeed";
import { NotificationsSettings } from "~/components/NotificationsSettings";
import { ProfileForm } from "~/components/ProfileForm";
import { formatAddress } from "~/utils/format";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  if (!session) {
    return (
      <SafeAreaView
        className="flex-1 bg-base-100 items-center justify-center px-8"
        edges={["bottom"]}
      >
        <Text className="text-6xl mb-4">🌭</Text>
        <Text className="font-display text-neutral text-2xl text-center mb-2 tracking-wide">
          JOIN THE GAME
        </Text>
        <Text className="text-neutral/60 text-center text-base mb-8">
          Sign in to log dogs, vote, and climb the leaderboard.
        </Text>
        <Pressable
          onPress={() => router.push("/sign-in")}
          className="bg-primary rounded-2xl px-8 py-4 w-full items-center"
        >
          <Text className="font-display text-neutral text-lg tracking-wider">
            SIGN IN
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const displayName =
    session.name ?? session.username ?? formatAddress(session.address);

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <ScrollView stickyHeaderIndices={[0]} className="flex-1">
        {/* Profile header */}
        <View className="bg-base-100 px-4 py-4 border-b border-base-300">
          <View className="flex-row items-center gap-3">
            <ProfileAvatar
              image={session.image}
              address={session.address}
              size={64}
            />
            <View className="flex-1">
              <Text className="font-bold text-neutral text-lg" numberOfLines={1}>
                {displayName}
              </Text>
              {session.username && (
                <Text className="text-neutral/50 text-sm">
                  @{session.username}
                </Text>
              )}
              <Text className="text-neutral/40 text-xs font-mono">
                {formatAddress(session.address)}
              </Text>
            </View>
            <Pressable
              onPress={signOut}
              className="bg-base-200 rounded-xl px-3 py-2"
            >
              <Text className="text-neutral/60 text-sm font-bold">
                Sign out
              </Text>
            </Pressable>
          </View>

          {session.fid && (
            <View className="mt-3 bg-info/10 rounded-xl px-3 py-2 flex-row items-center gap-2">
              <Text className="text-info text-xs font-bold">
                ✓ Farcaster verified · FID {session.fid}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => router.push("/(tabs)/earn")}
            className="mt-3 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2 flex-row items-center justify-between"
          >
            <Text className="text-neutral font-bold text-sm">💰 Earn & Stake $HOTDOG</Text>
            <Text className="text-neutral/40">→</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/faq")}
            className="mt-3 bg-base-200 rounded-xl px-3 py-2 flex-row items-center justify-between"
          >
            <Text className="text-neutral font-bold text-sm">📖 How it works · FAQ</Text>
            <Text className="text-neutral/40">→</Text>
          </Pressable>

          <NotificationsSettings address={session.address} fid={session.fid} />

          <ProfileForm
            existingUsername={session.username}
            existingImgUrl={session.image}
          />
        </View>

        {/* User's dog feed */}
        <HotdogFeed userAddress={session.address} />
      </ScrollView>
    </SafeAreaView>
  );
}

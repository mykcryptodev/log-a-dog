import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/providers/AuthProvider";
import { API_URL } from "~/constants";

interface InfoCardProps {
  icon: string;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}

function InfoCard({ icon, title, body, action }: InfoCardProps) {
  return (
    <View className="bg-base-200 rounded-2xl p-4 mb-3">
      <Text className="text-3xl mb-2">{icon}</Text>
      <Text className="font-bold text-neutral text-base mb-1">{title}</Text>
      <Text className="text-neutral/60 text-sm leading-relaxed">{body}</Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          className="mt-3 bg-primary rounded-xl py-2.5 items-center"
        >
          <Text className="font-bold text-neutral">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function EarnScreen() {
  const { session } = useAuth();

  const openWebApp = (path: string) => {
    Linking.openURL(`${API_URL}${path}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        <Text className="font-display text-neutral text-2xl mb-1 tracking-wider">
          EARN $HOTDOG
        </Text>
        <Text className="text-neutral/60 text-sm mb-6">
          Stake tokens to vote and earn rewards for accurate verdicts.
        </Text>

        <InfoCard
          icon="🌭"
          title="Log Dogs"
          body="Eat a hotdog, snap a pic, and log it onchain. Every valid dog earns you points on the leaderboard."
          action={{
            label: "Open Feed",
            onPress: () => openWebApp("/"),
          }}
        />

        <InfoCard
          icon="⚖️"
          title="Stake & Vote"
          body="Stake $HOTDOG tokens to earn voting rights. Accurate votes earn you rewards from the losing side's stake."
          action={{
            label: "Manage Stake",
            onPress: () => openWebApp("/earn"),
          }}
        />

        <InfoCard
          icon="🏆"
          title="Win the Contest"
          body={`Season 3 runs until Labor Day 2026. The player with the most valid dogs wins the prize pool.`}
          action={{
            label: "View Leaderboard",
            onPress: () => openWebApp("/leaderboard"),
          }}
        />

        <InfoCard
          icon="🪙"
          title="Zora Coins"
          body="Every dog you log automatically mints a Zora coin. Trade your coin or hold it — it captures the value of your hotdog moment."
          action={{
            label: "View on Zora",
            onPress: () => Linking.openURL("https://zora.co"),
          }}
        />

        <InfoCard
          icon="🎁"
          title="Airdrop"
          body="$HOTDOG tokens are airdropped to top players each season. Stay active and climb the leaderboard."
          action={{
            label: "Check Airdrop",
            onPress: () => openWebApp("/earn"),
          }}
        />

        {!session && (
          <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mt-2">
            <Text className="font-bold text-neutral mb-1">
              Sign in to earn
            </Text>
            <Text className="text-neutral/60 text-sm">
              Connect with Farcaster to log dogs and earn $HOTDOG tokens.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

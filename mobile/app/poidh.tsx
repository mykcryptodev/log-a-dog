import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const POIDH_BOUNTY_URL = "https://poidh.xyz/base/bounty/1265";

const STEPS = [
  { emoji: "🌭", title: "Eat a hotdog", body: "It must be a real dog — 4.8+ inches, in a bun." },
  { emoji: "📷", title: "Snap the proof", body: "Photograph yourself actively mid-bite. The camera needs to catch you in the act." },
  { emoji: "⬆️", title: "Log it onchain", body: "Upload your photo on Log a Dog. Your submission gets recorded on Base." },
  { emoji: "📢", title: "Share on Farcaster or X", body: "Post your logged submission publicly. Copy the link — you'll need it next." },
  { emoji: "🕹️", title: "Submit your claim on POIDH", body: "Paste your social post link as a bounty claim at poidh.xyz. That's your entry." },
];

const WINNING_CRITERIA = [
  { label: "Creative presentation", emoji: "🎨" },
  { label: "Humor", emoji: "😂" },
  { label: "Photographic quality", emoji: "📸" },
  { label: "Originality", emoji: "✨" },
];

const REQUIREMENTS = [
  "Hotdog is 4.8+ inches long, served in a bun",
  "You are visibly mid-bite in the photo",
  "Submission is logged on logadog.xyz (onchain via Base)",
  "Logged submission is shared on Farcaster or X",
  "Social post link is submitted as a claim on poidh.xyz",
];

export default function PoidhScreen() {
  const router = useRouter();
  const openPoidh = () => Linking.openURL(POIDH_BOUNTY_URL);

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} className="gap-4">
        {/* Hero */}
        <View className="items-center mb-4">
          <Text className="font-display text-4xl mb-1">🌭 × 🕹️</Text>
          <Text className="font-display text-neutral text-3xl tracking-wide">
            POIDH CAMPAIGN
          </Text>
          <Text className="text-neutral/60 text-sm mt-1 text-center">
            Log a Dog meets &quot;Pics or it didn&apos;t happen&quot;
          </Text>
        </View>

        {/* Prize banner */}
        <View className="bg-secondary rounded-3xl p-5 mb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-display text-white/80 text-xs tracking-widest">
              JULY 4 – 6, 2026
            </Text>
            <Text className="font-display text-white text-xl">
              THREE DAYS. THREE WINNERS.
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              One winner picked per day by the organizers.
            </Text>
          </View>
          <View className="items-center">
            <Text className="font-display text-white text-3xl">$50</Text>
            <Text className="font-display text-white/80 text-xs tracking-widest">
              ETH / DAY
            </Text>
          </View>
        </View>

        {/* How to participate */}
        <Text className="font-display text-neutral text-xl mb-3 tracking-wide">
          🎯 HOW TO PARTICIPATE
        </Text>
        <View className="gap-3 mb-4">
          {STEPS.map((step, idx) => (
            <View key={idx} className="flex-row items-start gap-3">
              <View className="bg-primary rounded-full w-7 h-7 items-center justify-center">
                <Text className="font-bold text-neutral text-sm">{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-neutral text-sm">
                  {step.emoji} {step.title}
                </Text>
                <Text className="text-neutral/60 text-sm">{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Winning criteria */}
        <Text className="font-display text-neutral text-xl mb-3 tracking-wide">
          🏆 WINNING CRITERIA
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-4">
          {WINNING_CRITERIA.map((c) => (
            <View
              key={c.label}
              className="bg-base-200 rounded-2xl px-3 py-2.5 flex-row items-center gap-2"
              style={{ width: "47%" }}
            >
              <Text className="text-xl">{c.emoji}</Text>
              <Text className="text-neutral text-sm font-bold flex-1">
                {c.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Requirements */}
        <Text className="font-display text-neutral text-xl mb-3 tracking-wide">
          ✅ ENTRY REQUIREMENTS
        </Text>
        <View className="gap-2 mb-6">
          {REQUIREMENTS.map((req) => (
            <View key={req} className="flex-row items-start gap-2">
              <Text className="text-accent">✓</Text>
              <Text className="text-neutral/70 text-sm flex-1">{req}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <Pressable
          onPress={() => router.push("/" as never)}
          className="bg-primary rounded-2xl py-4 items-center mb-3"
        >
          <Text className="font-display text-neutral text-lg tracking-wide">
            📷 LOG YOUR DOG 🌭
          </Text>
        </Pressable>
        <Pressable
          onPress={openPoidh}
          className="border-2 border-base-300 rounded-2xl py-4 items-center"
        >
          <Text className="font-display text-neutral tracking-wide">
            💰 SUBMIT CLAIM ON POIDH 🕹️
          </Text>
        </Pressable>

        <Text className="text-neutral/40 text-xs text-center mt-4">
          Campaign runs July 4–6, 2026. One $50 ETH prize awarded per day.
          Winners selected by organizers based on quality and creativity.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

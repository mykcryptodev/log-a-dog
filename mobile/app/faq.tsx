import React, { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Collapsible({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View className="bg-base-200 rounded-2xl mb-3 overflow-hidden">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center justify-between px-4 py-3.5"
      >
        <Text className="font-bold text-neutral text-base flex-1 pr-2">
          {title}
        </Text>
        <Text className="text-neutral/50 text-lg">{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open ? <View className="px-4 pb-4 gap-2">{children as any}</View> : null}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-neutral/60">•</Text>
      <Text className="text-neutral/70 text-sm leading-relaxed flex-1">
        {children as any}
      </Text>
    </View>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text className="font-bold text-neutral text-sm mt-2 mb-0.5">{children as any}</Text>
  );
}

export default function FaqScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <Text className="font-display text-neutral text-3xl mb-1 tracking-wide">
          🌭 FAQ & RULES
        </Text>
        <Text className="text-neutral/60 text-sm mb-5">
          Welcome to the global hotdog eating competition!
        </Text>

        <Collapsible title="What is Log a Dog?" defaultOpen>
          <Heading>A global competition with a simple, challenging goal:</Heading>
          <Bullet>Eat as many hotdogs as you can during Summer 2026 (Jul 4 – Sep 7).</Bullet>
          <Bullet>Record each hotdog by uploading a pic of you eating it.</Bullet>
          <Bullet>Compete against participants from all around the world.</Bullet>
          <Bullet>Rate the truthfulness of other submissions.</Bullet>
          <Bullet>Creative and dedicated loggers get rewarded along the way.</Bullet>
          <Heading>Powered by A.I. and blockchain</Heading>
          <Bullet>Logging a dog records a transaction on the blockchain.</Bullet>
          <Bullet>Users make onchain attestations about your logs to prove truthfulness.</Bullet>
          <Bullet>An AI bot attests automatically based on what it sees in the image.</Bullet>
        </Collapsible>

        <Collapsible title="What constitutes a hotdog?">
          <Heading>A valid hotdog:</Heading>
          <Bullet>Is at least 4.8 inches long.</Bullet>
          <Bullet>Is in a bun (gluten-free only if necessary).</Bullet>
          <Heading>Sausages, bratwursts, or other sausage-like foods?</Heading>
          <Bullet>Doesn&apos;t count.</Bullet>
          <Heading>Two dogs on one bun?</Heading>
          <Bullet>That is one dog.</Bullet>
          <Heading>A very long hotdog?</Heading>
          <Bullet>That is one dog.</Bullet>
          <Heading>Pigs-in-a-blanket equal to one hotdog?</Heading>
          <Bullet>No.</Bullet>
          <Heading>Do vegetarian or vegan hotdogs count?</Heading>
          <Bullet>Yes, but we&apos;re not happy about it.</Bullet>
          <Heading>Condiments or toppings?</Heading>
          <Bullet>No effect. Eat it plain or add as many toppings as you like.</Bullet>
        </Collapsible>

        <Collapsible title="How do I earn from eating hotdogs?">
          <Heading>Eat to Earn</Heading>
          <Bullet>Upload a pic of you eating a hotdog (one pic per dog).</Bullet>
          <Bullet>Your pic becomes a tradeable onchain token where you earn trading fees.</Bullet>
          <Bullet>Rewards throughout the summer for creative and standout dogs.</Bullet>
          <Heading>Moderate to Earn</Heading>
          <Bullet>Stake $HOTDOG to become a judge.</Bullet>
          <Bullet>Upvote pics of people eating hotdogs — you need to see the person eating it!</Bullet>
          <Bullet>Downvote spam, duplicates, and off-topic content.</Bullet>
          <Bullet>Incorrect votes are slashed and distributed to the correct voters.</Bullet>
        </Collapsible>

        <Collapsible title="How it works — step by step">
          <Heading>1. Log a dog</Heading>
          <Bullet>Upload a picture of you eating a hotdog. One pic per dog.</Bullet>
          <Heading>2. Climb the leaderboard</Heading>
          <Bullet>Keep logging — creative dogs get rewarded throughout the summer.</Bullet>
          <Heading>3. Judge others</Heading>
          <Bullet>Stake $HOTDOG and vote on submissions to earn rewards for accurate verdicts.</Bullet>
        </Collapsible>

        <Collapsible title="Why does this exist?">
          <Text className="text-neutral/70 text-sm leading-relaxed">
            The world needs this.
          </Text>
        </Collapsible>

        <Pressable
          onPress={() => Linking.openURL("https://www.logadog.xyz/faq")}
          className="mt-2 bg-primary rounded-2xl py-3 items-center"
        >
          <Text className="font-bold text-neutral">Read the full FAQ on the web</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

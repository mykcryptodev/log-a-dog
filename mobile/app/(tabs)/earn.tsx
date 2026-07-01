import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "~/providers/AuthProvider";
import { CHAIN_ID } from "~/constants";
import { trpc } from "~/utils/trpc";
import { getSeasonInfo } from "@shared/season";
import { ConnectWalletPrompt } from "~/components/earn/ConnectWalletPrompt";
import { BuyHotdog } from "~/components/earn/BuyHotdog";
import { RelevantHolders } from "~/components/earn/RelevantHolders";
import { StakePanel } from "~/components/earn/StakePanel";
import { ClaimRewardsPanel } from "~/components/earn/ClaimRewardsPanel";
import { ClaimProtocolRewardsPanel } from "~/components/earn/ClaimProtocolRewardsPanel";
import { AirdropPanel } from "~/components/earn/AirdropPanel";

export default function EarnScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const season = getSeasonInfo();
  const [tab, setTab] = useState<"stake" | "claim">("stake");

  const { data: apy } = trpc.staking.getApy.useQuery(
    { chainId: CHAIN_ID },
    { refetchOnWindowFocus: false, staleTime: 60_000 },
  );

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        <Text className="font-display text-neutral text-2xl mb-1 tracking-wider">
          EARN $HOTDOG
        </Text>
        <Text className="text-neutral/60 text-sm mb-4">
          Stake tokens to vote and earn rewards for accurate verdicts.
        </Text>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-accent/10 rounded-2xl p-4">
            <Text className="text-neutral/50 text-xs mb-1">Staking APY</Text>
            <Text className="font-display text-accent text-2xl">
              {typeof apy === "number" ? `${apy.toFixed(1)}%` : "—"}
            </Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-2xl p-4">
            <Text className="text-neutral/50 text-xs mb-1">
              Season {season.season}
            </Text>
            <Text className="font-display text-neutral text-2xl">
              {season.isLive ? `Day ${season.day}` : "Soon"}
            </Text>
          </View>
        </View>

        <ConnectWalletPrompt />
        <BuyHotdog />
        <RelevantHolders />

        <View className="flex-row gap-2 mb-4">
          {(["stake", "claim"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 rounded-xl py-2 items-center ${tab === t ? "bg-primary" : "bg-base-200"}`}
            >
              <Text
                className={`font-bold text-sm capitalize ${tab === t ? "text-neutral" : "text-neutral/60"}`}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "stake" ? (
          <>
            <StakePanel />
            <AirdropPanel />
          </>
        ) : (
          <>
            <ClaimRewardsPanel />
            <ClaimProtocolRewardsPanel />
          </>
        )}

        <Pressable
          onPress={() => router.push("/faq")}
          className="mb-3 bg-base-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
        >
          <Text className="text-neutral font-bold text-sm">
            📖 How judging works · Rules & FAQ
          </Text>
          <Text className="text-neutral/40">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/judge")}
          className="mb-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 flex-row items-center justify-between"
        >
          <Text className="text-neutral font-bold text-sm">
            ⚖️ Open Judge Queue
          </Text>
          <Text className="text-neutral/40">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/poidh")}
          className="mb-6 bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-3 flex-row items-center justify-between"
        >
          <Text className="text-neutral font-bold text-sm">
            🕹️ POIDH Campaign · Win $50 ETH/day
          </Text>
          <Text className="text-neutral/40">→</Text>
        </Pressable>

        {!session && (
          <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mt-2">
            <Text className="font-bold text-neutral mb-1">Sign in to earn</Text>
            <Text className="text-neutral/60 text-sm">
              Connect with Farcaster to log dogs and earn $HOTDOG tokens.
            </Text>
            <Pressable
              onPress={() => router.push("/sign-in")}
              className="mt-3 bg-primary rounded-xl py-2.5 items-center"
            >
              <Text className="font-bold text-neutral">Sign In</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

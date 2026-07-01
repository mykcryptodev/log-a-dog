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
import { isThirdwebConfigured } from "~/utils/thirdweb";
import { INK, PopButton } from "~/components/ui/Pop";

export default function EarnScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const season = getSeasonInfo();
  const [tab, setTab] = useState<"stake" | "claim">("stake");
  // The stake/claim/airdrop panels create a Thirdweb client at render time,
  // which throws if the build is missing the public client ID — guard so a
  // misconfigured build degrades to a message instead of crashing the tab.
  const walletReady = isThirdwebConfigured();

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
        {/* Page header (web: centered "💰 EARN $HOTDOG" + subtitle) */}
        <Text className="font-display text-neutral text-3xl mb-1 tracking-wide text-center">
          💰 EARN <Text className="text-secondary">$HOTDOG</Text>
        </Text>
        <Text className="text-neutral/70 text-sm mb-5 text-center">
          Stake, judge, and collect.
        </Text>

        <View className="flex-row gap-3 mb-4">
          <View
            className="flex-1 bg-base-100 rounded-2xl p-4"
            style={{ borderWidth: 3, borderColor: INK }}
          >
            <Text className="text-neutral/50 text-xs mb-1">Staking APY</Text>
            <Text className="font-display text-accent text-2xl">
              {typeof apy === "number" ? `${apy.toFixed(1)}%` : "—"}
            </Text>
          </View>
          <View
            className="flex-1 bg-primary rounded-2xl p-4"
            style={{ borderWidth: 3, borderColor: INK }}
          >
            <Text className="text-neutral/60 text-xs mb-1">
              Season {season.season}
            </Text>
            <Text className="font-display text-neutral text-2xl">
              {season.isLive ? `Day ${season.day}` : "Soon"}
            </Text>
          </View>
        </View>

        {walletReady && <ConnectWalletPrompt />}
        <BuyHotdog />
        <RelevantHolders />

        {walletReady ? (
          <>
            <View className="flex-row gap-2 mb-4">
              {(["stake", "claim"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  className={`flex-1 rounded-xl py-2 items-center ${tab === t ? "bg-primary" : "bg-base-200"}`}
                  style={{ borderWidth: 2.5, borderColor: INK }}
                >
                  <Text
                    className={`font-display text-sm capitalize tracking-wide ${tab === t ? "text-neutral" : "text-neutral/60"}`}
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
          </>
        ) : (
          <View className="bg-error/10 border border-error/30 rounded-2xl p-4 mb-4">
            <Text className="font-bold text-neutral mb-1">
              Wallet features unavailable
            </Text>
            <Text className="text-neutral/60 text-sm">
              This build is missing its Thirdweb client ID, so staking and
              claiming are disabled. Please update the app or contact support.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push("/faq")}
          className="mb-3 bg-base-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
          style={{ borderWidth: 2.5, borderColor: INK }}
        >
          <Text className="text-neutral font-bold text-sm">
            📖 How judging works · Rules & FAQ
          </Text>
          <Text className="text-neutral/40">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/judge")}
          className="mb-3 bg-accent/10 rounded-xl px-4 py-3 flex-row items-center justify-between"
          style={{ borderWidth: 2.5, borderColor: INK }}
        >
          <Text className="text-neutral font-bold text-sm">
            🧑‍⚖️ Open Judge Queue
          </Text>
          <Text className="text-neutral/40">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/poidh")}
          className="mb-6 bg-secondary/10 rounded-xl px-4 py-3 flex-row items-center justify-between"
          style={{ borderWidth: 2.5, borderColor: INK }}
        >
          <Text className="text-neutral font-bold text-sm">
            🕹️ POIDH Campaign · Win $50 ETH/day
          </Text>
          <Text className="text-neutral/40">→</Text>
        </Pressable>

        {!session && (
          <View
            className="bg-base-100 rounded-2xl p-4 mt-2"
            style={{ borderWidth: 3, borderColor: INK }}
          >
            <Text className="font-bold text-neutral mb-1">Sign in to earn</Text>
            <Text className="text-neutral/60 text-sm mb-3">
              Connect with Farcaster to log dogs and earn $HOTDOG tokens.
            </Text>
            <PopButton
              onPress={() => router.push("/sign-in")}
              radius={12}
              contentStyle={{ paddingVertical: 10, alignItems: "center" }}
            >
              <Text className="font-display text-neutral tracking-wide">Sign In</Text>
            </PopButton>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

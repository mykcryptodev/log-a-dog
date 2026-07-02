import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import { VoteBar } from "~/components/VoteBar";
import { AiJudgement } from "~/components/AiJudgement";
import { VotingCountdown } from "~/components/VotingCountdown";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { HotdogImage } from "~/components/HotdogImage";
import { InsufficientStakeModal } from "~/components/InsufficientStakeModal";
import { COLORS } from "~/constants/colors";
import { formatTimestamp, getDisplayName } from "~/utils/format";
import { isJudgeable } from "@shared/time";
import { useJudges, useUserVotes } from "~/hooks/useHotdogs";
import { useVote, useVoterAddress } from "~/hooks/useVote";
import type { ProcessedHotdog } from "~/types";
import * as Haptics from "expo-haptics";

const PAGE_SIZE = 50;
const SWIPE_THRESHOLD = 100;

function TopJudges() {
  const router = useRouter();
  const { judges, isLoading } = useJudges();

  if (isLoading) {
    return (
      <View className="py-6 items-center">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }
  if (judges.length === 0) {
    return (
      <View className="items-center px-8 py-16">
        <Text className="text-5xl mb-3">🏅</Text>
        <Text className="text-neutral/60 text-center text-base">
          No verdicts yet — the ranking appears once judges start voting.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4 pt-3 pb-8">
      <View className="gap-2">
        {judges.map((j, idx) => (
          <Pressable
            key={j.voter}
            onPress={() => router.push(`/profile/address/${j.voter}` as never)}
            className="flex-row items-center bg-base-200 rounded-2xl px-3 py-2.5"
          >
            <Text className="w-7 font-display text-secondary text-base">
              {idx + 1}
            </Text>
            <ProfileAvatar
              image={j.profile?.imgUrl}
              address={j.voter}
              size={36}
            />
            <Text
              className="flex-1 ml-3 font-bold text-neutral text-sm"
              numberOfLines={1}
            >
              {j.profile?.username
                ? j.profile.username
                : getDisplayName(null, j.voter)}
            </Text>
            <View className="items-end">
              <Text className="font-display text-neutral text-sm">
                {j.total} votes
              </Text>
              <Text className="text-neutral/50 text-xs">
                {j.accuracy.toFixed(1)}% accurate
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function JudgeScreen() {
  const [view, setView] = useState<"deck" | "judges">("deck");
  const [currentIdx, setCurrentIdx] = useState(0);
  const { width } = useWindowDimensions();
  const voterAddress = useVoterAddress();
  const { vote, isVoting } = useVote();
  const [showInsufficientStake, setShowInsufficientStake] = useState(false);
  // Verdicts cast this session. The indexer can lag behind a fresh on-chain
  // vote, so a refetch alone won't drop the card from the queue — this does.
  const [votedLogIds, setVotedLogIds] = useState<Set<string>>(new Set());

  const query = trpc.hotdog.getAll.useQuery(
    {
      chainId: CHAIN_ID,
      user: ZERO_ADDRESS,
      voter: voterAddress ?? ZERO_ADDRESS,
      start: 0,
      limit: PAGE_SIZE,
    },
    { staleTime: 60_000 },
  );

  const userVotes = useUserVotes(voterAddress);

  const allDogs = useMemo(
    () => (query.data?.hotdogs ?? []) as ProcessedHotdog[],
    [query.data?.hotdogs],
  );

  const pending = useMemo(() => {
    const userAttested = query.data?.userAttested ?? [];
    return allDogs
      .map((h, i) => ({ h, i }))
      .filter(({ h, i }) => {
        const open = isJudgeable(h.timestamp, h.attestationPeriod?.status);
        const alreadyVoted =
          votedLogIds.has(h.logId) ||
          (voterAddress &&
            ((userAttested[i] ?? false) || userVotes?.[h.logId] !== undefined));
        return open && !alreadyVoted;
      })
      .map(({ h }) => h);
  }, [allDogs, query.data?.userAttested, userVotes, voterAddress, votedLogIds]);

  const validCounts = query.data?.validAttestations ?? [];
  const invalidCounts = query.data?.invalidAttestations ?? [];

  const safeIdx = pending.length > 0 ? currentIdx % pending.length : 0;
  const dog = pending[safeIdx];
  const globalIdx = dog ? allDogs.findIndex((h) => h.logId === dog.logId) : -1;

  const handleSkip = useCallback(() => {
    if (pending.length < 2) return;
    setCurrentIdx((i) => (i + 1) % pending.length);
  }, [pending.length]);

  const handleVoteSuccess = useCallback(
    (logId: string) => {
      setVotedLogIds((prev) => {
        const next = new Set(prev);
        next.add(logId);
        return next;
      });
      void query.refetch();
    },
    [query],
  );

  const castVote = useCallback(
    async (isValid: boolean) => {
      if (!dog || isVoting) return;
      if (!voterAddress) {
        Alert.alert("Sign In Required", "Please sign in to judge dogs.");
        return;
      }
      const logId = dog.logId;
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await vote({ logId, isValid });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleVoteSuccess(logId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to vote";
        // Revert on a stale card — the verdict is already on-chain.
        if (/already attested/i.test(msg)) {
          handleVoteSuccess(logId);
          return;
        }
        if (msg.includes("Insufficient stake")) {
          setShowInsufficientStake(true);
        } else {
          Alert.alert("Error", msg);
        }
      }
    },
    [dog, isVoting, voterAddress, vote, handleVoteSuccess],
  );

  const swipeX = useRef(new Animated.Value(0)).current;

  const resetSwipe = useCallback(() => {
    Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
  }, [swipeX]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      swipeX.setValue(e.translationX);
    })
    .onEnd((e) => {
      if (dog && !isVoting) {
        if (e.translationX > SWIPE_THRESHOLD) {
          void castVote(true);
        } else if (e.translationX < -SWIPE_THRESHOLD) {
          void castVote(false);
        }
      }
      resetSwipe();
    });

  const rotate = swipeX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ["-10deg", "0deg", "10deg"],
  });
  const validStampOpacity = swipeX.interpolate({
    inputRange: [0, 40, SWIPE_THRESHOLD],
    outputRange: [0, 0.25, 1],
    extrapolate: "clamp",
  });
  const susStampOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -40, 0],
    outputRange: [1, 0.25, 0],
    extrapolate: "clamp",
  });

  const eaterName = getDisplayName(dog?.eaterProfile, dog?.eater ?? "");

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <InsufficientStakeModal
        visible={showInsufficientStake}
        onClose={() => setShowInsufficientStake(false)}
      />

      {/* Deck / Top Judges switcher */}
      <View
        className="flex-row mx-4 mt-2 bg-base-200 rounded-2xl p-1"
        style={{ borderWidth: 2, borderColor: COLORS.neutral }}
      >
        {(
          [
            { key: "deck", label: `🧑‍⚖️ JUDGE${pending.length > 0 ? ` (${pending.length})` : ""}` },
            { key: "judges", label: "🏅 TOP JUDGES" },
          ] as const
        ).map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setView(t.key)}
            className={`flex-1 rounded-xl py-2 items-center ${view === t.key ? "bg-primary" : ""}`}
          >
            <Text
              className={`font-display text-sm tracking-wide ${view === t.key ? "text-neutral" : "text-neutral/50"}`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === "judges" ? (
        <ScrollView className="flex-1">
          <TopJudges />
        </ScrollView>
      ) : query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text className="text-neutral/60 mt-3">Loading the queue…</Text>
        </View>
      ) : !dog ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-6xl mb-4">🎉</Text>
          <Text className="font-display text-neutral text-2xl text-center mb-2">
            ALL CLEAR
          </Text>
          <Text className="text-neutral/60 text-center text-base mb-6">
            No dogs waiting for a verdict right now. Check back in a bit!
          </Text>
          <Pressable
            onPress={() => void query.refetch()}
            className="bg-base-200 rounded-xl px-5 py-2.5"
            style={{ borderWidth: 2, borderColor: COLORS.neutral }}
          >
            <Text className="font-bold text-neutral text-sm">Refresh</Text>
          </Pressable>
        </View>
      ) : (
        /* The deck fills the space between the switcher and the tab bar, so
           the card (image + pinned vote controls) always fits — nothing to
           scroll, nothing cut off. */
        <View className="flex-1 px-4 pt-2 pb-3">
          {/* Queue header */}
          <View className="flex-row items-center justify-between pb-2">
            <Text className="text-neutral/60 text-sm">
              Dog {safeIdx + 1} of {pending.length} awaiting verdict
            </Text>
            {pending.length > 1 && (
              <Pressable
                onPress={handleSkip}
                className="bg-base-200 rounded-xl px-3 py-1.5"
              >
                <Text className="text-neutral font-bold text-sm">Skip →</Text>
              </Pressable>
            )}
          </View>

          {/* Card — swipe right = VALID, left = SUS */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              className="flex-1 bg-base-100 rounded-3xl overflow-hidden"
              style={{
                transform: [{ translateX: swipeX }, { rotate }],
                borderWidth: 3,
                borderColor: COLORS.neutral,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center px-3 py-2 gap-2">
                <ProfileAvatar
                  image={dog.eaterProfile?.image}
                  address={dog.eater}
                  size={36}
                />
                <View className="flex-1">
                  <Text className="font-bold text-neutral text-sm" numberOfLines={1}>
                    {eaterName}
                  </Text>
                  <Text className="text-xs text-neutral/50">
                    {formatTimestamp(dog.timestamp)}
                  </Text>
                </View>
                <VotingCountdown timestamp={dog.timestamp} />
              </View>

              {/* Photo — flexes to whatever space is left, never clipped off-screen */}
              <View className="flex-1 bg-base-300">
                <HotdogImage
                  preview={dog.zoraCoin?.mediaContent?.previewImage?.medium}
                  rawImageUri={dog.imageUri}
                  blurhash={dog.zoraCoin?.mediaContent?.previewImage?.blurhash}
                />

                {/* Swipe verdict stamps */}
                <Animated.View
                  pointerEvents="none"
                  className="absolute top-5 left-4 rounded-xl px-3 py-1.5"
                  style={{
                    opacity: validStampOpacity,
                    backgroundColor: COLORS.accent,
                    borderWidth: 3,
                    borderColor: COLORS.neutral,
                    transform: [{ rotate: "-12deg" }],
                  }}
                >
                  <Text className="font-display text-white text-2xl tracking-widest">
                    VALID
                  </Text>
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  className="absolute top-5 right-4 rounded-xl px-3 py-1.5"
                  style={{
                    opacity: susStampOpacity,
                    backgroundColor: COLORS.error,
                    borderWidth: 3,
                    borderColor: COLORS.neutral,
                    transform: [{ rotate: "12deg" }],
                  }}
                >
                  <Text className="font-display text-white text-2xl tracking-widest">
                    SUS
                  </Text>
                </Animated.View>

                {isVoting && (
                  <View className="absolute inset-0 bg-black/40 items-center justify-center">
                    <ActivityIndicator color={COLORS.white} size="large" />
                    <Text className="font-display text-white mt-2 tracking-wide">
                      CASTING VERDICT…
                    </Text>
                  </View>
                )}
              </View>

              {/* Verdict controls — pinned to the card bottom */}
              <View className="px-3 pb-3">
                {globalIdx >= 0 && (
                  <VoteBar
                    logId={dog.logId}
                    validCount={validCounts[globalIdx] ?? "0"}
                    invalidCount={invalidCounts[globalIdx] ?? "0"}
                    userHasVoted={false}
                    userVotedValid={false}
                    attestationStatus={dog.attestationPeriod?.status}
                    onVoteSuccess={() => handleVoteSuccess(dog.logId)}
                  />
                )}
                <View className="flex-row items-center justify-between pt-2">
                  <AiJudgement logId={dog.logId} timestamp={dog.timestamp} />
                  <Text className="text-neutral/40 text-xs">
                    Swipe → VALID · ← SUS
                  </Text>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      )}
    </SafeAreaView>
  );
}

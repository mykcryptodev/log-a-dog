import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { HotdogImage } from "~/components/HotdogImage";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { ProfileBadge } from "~/components/ProfileBadge";
import { VoteBar } from "~/components/VoteBar";
import { AiJudgement } from "~/components/AiJudgement";
import { VotingCountdown } from "~/components/VotingCountdown";
import { PopCard, PopSticker, INK } from "~/components/ui/Pop";
import { HotdogLoader } from "~/components/ui/HotdogLoader";
import { COLORS } from "~/constants/colors";
import { ATTESTATION_WINDOW_SECONDS } from "~/constants";
import { formatTimestamp, getDisplayName } from "~/utils/format";
import type { ProcessedHotdog } from "~/types";

interface Props {
  hotdog: ProcessedHotdog;
  validCount: string;
  invalidCount: string;
  userHasVoted: boolean;
  userVotedValid: boolean;
  onVoteSuccess?: () => void;
  showAiJudgement?: boolean;
  /** Optimistic card for a log still confirming on-chain. */
  pending?: boolean;
}

export function HotdogCard({
  hotdog,
  validCount,
  invalidCount,
  userHasVoted,
  userVotedValid,
  onVoteSuccess,
  showAiJudgement = false,
  pending = false,
}: Props) {
  const router = useRouter();

  // Optimistic cards breathe softly while the log confirms on-chain, so
  // "in flight" reads at a glance instead of just looking washed out.
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (pending) {
      pulse.value = withRepeat(
        withTiming(1, {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        true,
        undefined,
        ReduceMotion.System,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [pending, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pending ? 0.6 + pulse.value * 0.3 : 1,
  }));

  const eaterName = useMemo(
    () => getDisplayName(hotdog.eaterProfile, hotdog.eater),
    [hotdog.eaterProfile, hotdog.eater],
  );
  const loggerName = useMemo(
    () => getDisplayName(hotdog.loggerProfile, hotdog.logger),
    [hotdog.loggerProfile, hotdog.logger],
  );
  const showVia =
    hotdog.eater.toLowerCase() !== hotdog.logger.toLowerCase();

  const isResolved = hotdog.attestationPeriod?.status === 1;
  const isValid = hotdog.attestationPeriod?.isValid ?? false;
  const isExpired =
    Number(hotdog.timestamp) * 1000 + ATTESTATION_WINDOW_SECONDS * 1000 <=
    Date.now();

  // Status sticker (web HotdogCard): mustard = voting live, green = valid,
  // red = sus. The single verdict/state tag, top-left of the photo.
  const status = pending
    ? { label: "LOGGING…", bg: COLORS.base300, fg: COLORS.neutral }
    : isResolved
      ? isValid
        ? { label: "VALID DOG", bg: COLORS.accent, fg: COLORS.base100 }
        : { label: "RULED SUS", bg: COLORS.error, fg: "#FFFFFF" }
      : !isExpired
        ? { label: "ON THE GRILL", bg: COLORS.primary, fg: COLORS.neutral }
        : { label: "FINAL", bg: COLORS.base300, fg: COLORS.neutral };

  return (
    <Animated.View
      style={[{ marginHorizontal: 16, marginBottom: 20 }, pulseStyle]}
    >
    <PopCard
      offset={6}
      radius={28}
      contentStyle={{ padding: 14 }}
    >
      {/* Identity row */}
      <View className="flex-row items-center gap-2 mb-3">
        <Pressable
          disabled={pending}
          className="flex-row items-center gap-2 flex-1"
          onPress={() =>
            router.push(`/profile/address/${hotdog.eater}` as never)
          }
        >
          {/* pop-frame avatar ring */}
          <View
            style={{
              borderWidth: 2.5,
              borderColor: INK,
              borderRadius: 22,
              overflow: "hidden",
            }}
          >
            <ProfileAvatar
              image={hotdog.eaterProfile?.image}
              address={hotdog.eater}
              size={36}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text
                className="font-display text-neutral text-base tracking-wide"
                numberOfLines={1}
              >
                {eaterName}
              </Text>
              <ProfileBadge profile={hotdog.eaterProfile} />
            </View>
            {showVia && (
              <Text className="text-xs text-neutral/50" numberOfLines={1}>
                via {loggerName}
              </Text>
            )}
          </View>
        </Pressable>
        <Text className="text-xs text-neutral/40">
          {formatTimestamp(hotdog.timestamp)}
        </Text>
      </View>

      {/* Framed photo (web: flip-face pop-frame rounded-2xl) */}
      <Pressable
        disabled={pending}
        onPress={() => router.push(`/dog/${hotdog.logId}` as never)}
        style={{
          aspectRatio: 4 / 5,
          borderWidth: 3,
          borderColor: INK,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: COLORS.base300,
        }}
      >
        <HotdogImage
          preview={hotdog.zoraCoin?.mediaContent?.previewImage?.medium}
          rawImageUri={hotdog.imageUri}
          blurhash={hotdog.zoraCoin?.mediaContent?.previewImage?.blurhash}
        />

        {/* Status sticker */}
        <PopSticker
          rotate={-3}
          radius={8}
          backgroundColor={status.bg}
          style={{ position: "absolute", top: 12, left: 12 }}
          contentStyle={{ paddingHorizontal: 8, paddingVertical: 3 }}
        >
          <Text
            className="font-display text-xs tracking-wider"
            style={{ color: status.fg }}
          >
            {status.label}
          </Text>
        </PopSticker>

        {hotdog.duplicateOfLogId && (
          <Pressable
            onPress={() =>
              router.push(`/dog/${hotdog.duplicateOfLogId}` as never)
            }
            className="absolute bottom-3 left-3 bg-primary rounded-full px-2 py-1"
            style={{ borderWidth: 2, borderColor: INK }}
          >
            <Text className="text-neutral text-xs font-bold">
              ♻ Dup #{hotdog.duplicateOfLogId}
            </Text>
          </Pressable>
        )}
      </Pressable>

      {pending ? (
        /* Optimistic card — confirming on-chain */
        <View className="pt-3 flex-row items-center gap-2">
          <HotdogLoader size={16} />
          <Text className="text-neutral/60 text-sm font-medium">
            Posting onchain…
          </Text>
        </View>
      ) : (
        <>
          {/* THE vote control — primary, full-width */}
          <VoteBar
            logId={hotdog.logId}
            validCount={validCount}
            invalidCount={invalidCount}
            userHasVoted={userHasVoted}
            userVotedValid={userVotedValid}
            attestationStatus={hotdog.attestationPeriod?.status}
            onVoteSuccess={onVoteSuccess}
          />

          {/* Metadata row: AI verdict + countdown · log number sticker */}
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-3 flex-1">
              {showAiJudgement && (
                <AiJudgement logId={hotdog.logId} timestamp={hotdog.timestamp} />
              )}
              {hotdog.attestationPeriod && !isResolved && (
                <VotingCountdown timestamp={hotdog.timestamp} />
              )}
            </View>
            <PopSticker
              rotate={-2}
              radius={10}
              backgroundColor={COLORS.primary}
              contentStyle={{ paddingHorizontal: 9, paddingVertical: 3 }}
            >
              <Text className="font-display text-neutral text-sm tracking-wide">
                🌭 #{hotdog.logId}
              </Text>
            </PopSticker>
          </View>
        </>
      )}
    </PopCard>
    </Animated.View>
  );
}

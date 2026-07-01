import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Text,
  View,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { trpc } from "~/utils/trpc";
import { useAuth } from "~/providers/AuthProvider";
import { CHAIN_ID } from "~/constants";
import { getVotePct } from "~/utils/format";
import { COLORS } from "~/constants/colors";
import { InsufficientStakeModal } from "~/components/InsufficientStakeModal";
import { PopButton } from "~/components/ui/Pop";

interface Props {
  logId: string;
  validCount: string;
  invalidCount: string;
  userHasVoted: boolean;
  userVotedValid: boolean;
  attestationStatus?: number;
  disabled?: boolean;
  onVoteSuccess?: () => void;
}

export function VoteBar({
  logId,
  validCount,
  invalidCount,
  userHasVoted,
  userVotedValid,
  attestationStatus,
  disabled,
  onVoteSuccess,
}: Props) {
  const { session } = useAuth();
  const validScale = useRef(new Animated.Value(1)).current;
  const invalidScale = useRef(new Animated.Value(1)).current;
  const [showInsufficientStake, setShowInsufficientStake] = useState(false);

  const { validPct, invalidPct } = getVotePct(validCount, invalidCount);

  const judgeMutation = trpc.hotdog.judge.useMutation({
    onSuccess: () => {
      onVoteSuccess?.();
    },
    onError: (err) => {
      const msg = err.message ?? "Failed to vote";
      if (msg.includes("Insufficient stake")) {
        setShowInsufficientStake(true);
      } else {
        Alert.alert("Error", msg);
      }
    },
  });

  const handleVote = useCallback(
    async (isValid: boolean) => {
      if (!session) {
        Alert.alert("Sign In Required", "Please sign in to vote.");
        return;
      }
      if (disabled || attestationStatus === 1) return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const scaleRef = isValid ? validScale : invalidScale;
      Animated.sequence([
        Animated.timing(scaleRef, {
          toValue: 0.93,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleRef, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      const shouldRevoke = userHasVoted && userVotedValid === isValid;
      judgeMutation.mutate({
        chainId: CHAIN_ID,
        logId,
        isValid,
        shouldRevoke,
      });
    },
    [session, disabled, attestationStatus, userHasVoted, userVotedValid, logId, judgeMutation, validScale, invalidScale],
  );

  const isResolved = attestationStatus === 1;

  return (
    <View className="pt-3">
      <InsufficientStakeModal
        visible={showInsufficientStake}
        onClose={() => setShowInsufficientStake(false)}
      />

      {/* Tally meter — web shows it only once the verdict is in. */}
      {isResolved && (
        <View
          className="h-2.5 bg-base-300 rounded-full mb-2 overflow-hidden flex-row"
          style={{ borderWidth: 1.5, borderColor: COLORS.neutral }}
        >
          <View className="h-full bg-accent" style={{ flex: validPct }} />
          <View className="h-full bg-error" style={{ flex: invalidPct }} />
        </View>
      )}

      {userHasVoted && !isResolved && (
        <View className="mb-2 bg-base-200 rounded-lg py-1 items-center">
          <Text className="font-display text-neutral/70 text-xs tracking-wide">
            ✓ you voted {userVotedValid ? "VALID DOG" : "SUS"} — verdict locked
          </Text>
        </View>
      )}

      {/* Sticker-brutalism vote control (web pop-btn pair) */}
      <View className="flex-row" style={{ gap: 10 }}>
        <Animated.View
          style={{ flex: 1, transform: [{ scale: validScale }] }}
        >
          <PopButton
            onPress={() => handleVote(true)}
            disabled={isResolved || judgeMutation.isLoading}
            backgroundColor={COLORS.accent}
            radius={12}
            contentStyle={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text className="font-display text-sm tracking-wide" style={{ color: COLORS.base100 }}>
              {userHasVoted && userVotedValid ? "✓ " : ""}🥬 VALID DOG
            </Text>
          </PopButton>
        </Animated.View>

        <Animated.View
          style={{ flex: 1, transform: [{ scale: invalidScale }] }}
        >
          <PopButton
            onPress={() => handleVote(false)}
            disabled={isResolved || judgeMutation.isLoading}
            backgroundColor={COLORS.error}
            radius={12}
            contentStyle={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text className="font-display text-white text-sm tracking-wide">
              {userHasVoted && !userVotedValid ? "✓ " : ""}🔴 SUS
            </Text>
          </PopButton>
        </Animated.View>
      </View>
    </View>
  );
}

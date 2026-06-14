import React, { useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
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

  const { validPct, invalidPct } = getVotePct(validCount, invalidCount);

  const judgeMutation = trpc.hotdog.judge.useMutation({
    onSuccess: () => {
      onVoteSuccess?.();
    },
    onError: (err: Error) => {
      const msg = err.message ?? "Failed to vote";
      if (msg.includes("Insufficient stake")) {
        Alert.alert(
          "Insufficient Stake",
          "You need at least 300,000 $HOTDOG tokens staked to vote. Visit the Earn tab to stake.",
        );
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
    <View className="px-3 pb-3 pt-1">
      {/* Progress bar */}
      <View className="h-1.5 bg-base-300 rounded-full mb-2 overflow-hidden flex-row">
        <View
          className="h-full bg-accent rounded-full"
          style={{ flex: validPct }}
        />
        <View
          className="h-full bg-error rounded-full"
          style={{ flex: invalidPct }}
        />
      </View>

      <View className="flex-row gap-2">
        {/* VALID DOG button */}
        <Animated.View
          style={{ flex: 1, transform: [{ scale: validScale }] }}
        >
          <Pressable
            onPress={() => handleVote(true)}
            disabled={isResolved || judgeMutation.isLoading}
            className={[
              "rounded-xl py-2.5 items-center justify-center border",
              userHasVoted && userVotedValid
                ? "bg-accent border-accent"
                : "bg-accent/10 border-accent/40",
              isResolved ? "opacity-50" : "",
            ].join(" ")}
          >
            <Text
              className={[
                "font-bold text-sm",
                userHasVoted && userVotedValid ? "text-white" : "text-accent",
              ].join(" ")}
            >
              ✓ VALID {validPct}%
            </Text>
          </Pressable>
        </Animated.View>

        {/* SUS button */}
        <Animated.View
          style={{ flex: 1, transform: [{ scale: invalidScale }] }}
        >
          <Pressable
            onPress={() => handleVote(false)}
            disabled={isResolved || judgeMutation.isLoading}
            className={[
              "rounded-xl py-2.5 items-center justify-center border",
              userHasVoted && !userVotedValid
                ? "bg-error border-error"
                : "bg-error/10 border-error/40",
              isResolved ? "opacity-50" : "",
            ].join(" ")}
          >
            <Text
              className={[
                "font-bold text-sm",
                userHasVoted && !userVotedValid ? "text-white" : "text-error",
              ].join(" ")}
            >
              ✗ SUS {invalidPct}%
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

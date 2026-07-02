import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Text,
  View,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useVote, useVoterAddress } from "~/hooks/useVote";
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
  const voterAddress = useVoterAddress();
  const { vote, isVoting } = useVote();
  const validScale = useRef(new Animated.Value(1)).current;
  const invalidScale = useRef(new Animated.Value(1)).current;
  const [showInsufficientStake, setShowInsufficientStake] = useState(false);
  // Optimistic lock so the buttons freeze the moment a verdict lands, before
  // the server props catch up.
  const [castVote, setCastVote] = useState<boolean | null>(null);

  const { validPct, invalidPct } = getVotePct(validCount, invalidCount);

  const hasVoted = userHasVoted || castVote !== null;
  const votedValid = castVote ?? userVotedValid;
  const isResolved = attestationStatus === 1;

  const handleVote = useCallback(
    async (isValid: boolean) => {
      if (!voterAddress) {
        Alert.alert("Sign In Required", "Please sign in to vote.");
        return;
      }
      // Attestations are final on-chain (the contract has no revoke and
      // reverts on a second attest), so a cast verdict locks the buttons.
      if (disabled || isResolved || isVoting || hasVoted) return;

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

      try {
        await vote({ logId, isValid });
        setCastVote(isValid);
        onVoteSuccess?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to vote";
        // A revert here means our local state was stale — the vote is already
        // on-chain. Lock the buttons and refresh instead of surfacing an error.
        if (/already attested/i.test(msg)) {
          setCastVote(isValid);
          onVoteSuccess?.();
          return;
        }
        if (msg.includes("Insufficient stake")) {
          setShowInsufficientStake(true);
        } else {
          Alert.alert("Error", msg);
        }
      }
    },
    [voterAddress, disabled, isResolved, isVoting, hasVoted, logId, vote, onVoteSuccess, validScale, invalidScale],
  );

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

      {hasVoted && !isResolved && (
        <View className="mb-2 bg-base-200 rounded-lg py-1 items-center">
          <Text className="font-display text-neutral/70 text-xs tracking-wide">
            ✓ you voted {votedValid ? "VALID DOG" : "SUS"} — verdict locked
          </Text>
        </View>
      )}

      {/* Sticker-brutalism vote control (web pop-btn pair) */}
      <View className="flex-row" style={{ gap: 10 }}>
        <Animated.View
          style={{ flex: 1, transform: [{ scale: validScale }], opacity: hasVoted && !votedValid ? 0.35 : 1 }}
        >
          <PopButton
            onPress={() => handleVote(true)}
            disabled={isResolved || isVoting || hasVoted}
            backgroundColor={COLORS.accent}
            radius={12}
            contentStyle={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text className="font-display text-sm tracking-wide" style={{ color: COLORS.base100 }}>
              {hasVoted && votedValid ? "✓ " : ""}🥬 VALID DOG
            </Text>
          </PopButton>
        </Animated.View>

        <Animated.View
          style={{ flex: 1, transform: [{ scale: invalidScale }], opacity: hasVoted && votedValid ? 0.35 : 1 }}
        >
          <PopButton
            onPress={() => handleVote(false)}
            disabled={isResolved || isVoting || hasVoted}
            backgroundColor={COLORS.error}
            radius={12}
            contentStyle={{ paddingVertical: 10, alignItems: "center" }}
          >
            <Text className="font-display text-white text-sm tracking-wide">
              {hasVoted && !votedValid ? "✓ " : ""}🔴 SUS
            </Text>
          </PopButton>
        </Animated.View>
      </View>
    </View>
  );
}

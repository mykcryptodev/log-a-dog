import React, { useMemo } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { ProfileBadge } from "~/components/ProfileBadge";
import { VerdictStamp } from "~/components/VerdictStamp";
import { VoteBar } from "~/components/VoteBar";
import { AiJudgement } from "~/components/AiJudgement";
import { VotingCountdown } from "~/components/VotingCountdown";
import {
  convertIpfsToHttps,
  formatTimestamp,
  getDisplayName,
} from "~/utils/format";
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
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 480);
  const imageHeight = Math.round(cardWidth * (5 / 4));

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

  const imageUri = useMemo(
    () =>
      convertIpfsToHttps(
        hotdog.zoraCoin?.mediaContent?.previewImage?.medium ??
          hotdog.imageUri,
      ),
    [hotdog.zoraCoin, hotdog.imageUri],
  );

  const isResolved = hotdog.attestationPeriod?.status === 1;
  const isValid = hotdog.attestationPeriod?.isValid ?? false;

  return (
    <View
      className="mb-4 mx-4 rounded-3xl overflow-hidden bg-base-200"
      style={{
        shadowColor: "#E23B2E",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 4,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {/* Header + Image — tapping navigates to dog detail page */}
      <Pressable
        disabled={pending}
        onPress={() => router.push(`/dog/${hotdog.logId}` as never)}
      >
        {/* Header — tapping the eater navigates to their profile */}
        <View className="flex-row items-center p-3 gap-2">
          <Pressable
            disabled={pending}
            className="flex-row items-center gap-2 flex-1"
            onPress={() =>
              router.push(`/profile/address/${hotdog.eater}` as never)
            }
          >
            <ProfileAvatar
              image={hotdog.eaterProfile?.image}
              address={hotdog.eater}
              size={38}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="font-bold text-neutral text-sm" numberOfLines={1}>
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

        {/* Image */}
        <View style={{ width: cardWidth, height: imageHeight }}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ flex: 1 }}
              contentFit="cover"
              transition={300}
              placeholder={hotdog.zoraCoin?.mediaContent?.previewImage?.blurhash}
            />
          ) : (
            <View className="flex-1 bg-base-300 items-center justify-center">
              <Text className="text-5xl">🌭</Text>
            </View>
          )}
          {isResolved && <VerdictStamp isValid={isValid} />}
          {hotdog.duplicateOfLogId && (
            <Pressable
              onPress={() =>
                router.push(`/dog/${hotdog.duplicateOfLogId}` as never)
              }
              className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-1"
            >
              <Text className="text-white text-xs">♻ Dup #{hotdog.duplicateOfLogId}</Text>
            </Pressable>
          )}
        </View>
      </Pressable>

      {pending ? (
        /* Optimistic card — confirming on-chain */
        <View className="px-3 py-3 flex-row items-center gap-2">
          <Text className="text-sm">⏳</Text>
          <Text className="text-neutral/60 text-sm font-medium">
            Posting onchain…
          </Text>
        </View>
      ) : (
        <>
          {/* Vote bar — outside navigation pressable so taps register correctly */}
          <VoteBar
            logId={hotdog.logId}
            validCount={validCount}
            invalidCount={invalidCount}
            userHasVoted={userHasVoted}
            userVotedValid={userVotedValid}
            attestationStatus={hotdog.attestationPeriod?.status}
            onVoteSuccess={onVoteSuccess}
          />

          {/* Meta row — AI verdict + live voting countdown */}
          {(showAiJudgement || (hotdog.attestationPeriod && !isResolved)) && (
            <View className="flex-row items-center gap-3 px-3 pb-1">
              {showAiJudgement && (
                <AiJudgement logId={hotdog.logId} timestamp={hotdog.timestamp} />
              )}
              {hotdog.attestationPeriod && !isResolved && (
                <VotingCountdown timestamp={hotdog.timestamp} />
              )}
            </View>
          )}

          {/* Footer */}
          <View className="flex-row items-center justify-between px-3 pb-3">
            <Text className="text-xs text-neutral/40 font-mono">
              🌭 #{hotdog.logId}
            </Text>
            {hotdog.zoraCoin?.marketCap && (
              <View className="flex-row items-center gap-2">
                {typeof hotdog.zoraCoin.uniqueHolders === "number" && (
                  <Text className="text-xs text-neutral/40">
                    {hotdog.zoraCoin.uniqueHolders} holders
                  </Text>
                )}
                <Text className="text-xs text-info">
                  Ξ {parseFloat(hotdog.zoraCoin.marketCap).toFixed(4)} mcap
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

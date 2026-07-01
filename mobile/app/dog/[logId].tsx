import React from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { ProfileBadge } from "~/components/ProfileBadge";
import { VerdictStamp } from "~/components/VerdictStamp";
import { VoteBar } from "~/components/VoteBar";
import { AiJudgement } from "~/components/AiJudgement";
import { VotingCountdown } from "~/components/VotingCountdown";
import { Comments } from "~/components/Comments";
import { COLORS } from "~/constants/colors";
import { formatAbbreviatedFiat } from "@shared/format";
import {
  convertIpfsToHttps,
  formatTimestamp,
  getDisplayName,
} from "~/utils/format";
import { useAuth } from "~/providers/AuthProvider";

export default function DogDetailScreen() {
  const { logId } = useLocalSearchParams<{ logId: string }>();
  const { session } = useAuth();
  const { width } = useWindowDimensions();

  const query = trpc.hotdog.getById.useQuery(
    {
      chainId: CHAIN_ID,
      user: session?.address ?? ZERO_ADDRESS,
      logId: logId ?? "",
    },
    { enabled: !!logId },
  );

  const imageHeight = Math.round(width * (5 / 4));

  if (query.isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-base-100 items-center justify-center"
        edges={["bottom"]}
      >
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!query.data?.hotdog) {
    return (
      <SafeAreaView
        className="flex-1 bg-base-100 items-center justify-center px-8"
        edges={["bottom"]}
      >
        <Text className="text-5xl mb-4">🌭</Text>
        <Text className="text-neutral/60 text-center text-base">
          Dog not found or still indexing. Pull to refresh.
        </Text>
        <Pressable
          onPress={() => query.refetch()}
          className="mt-4 bg-primary rounded-xl px-6 py-3"
        >
          <Text className="font-bold text-neutral">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { hotdog, validAttestations, invalidAttestations, userAttested, userAttestation } =
    query.data;

  const imageUri = convertIpfsToHttps(
    hotdog.zoraCoin?.mediaContent?.previewImage?.medium ?? hotdog.imageUri,
  );
  const eaterName = getDisplayName(hotdog.eaterProfile, hotdog.eater);
  const loggerName = getDisplayName(hotdog.loggerProfile, hotdog.logger);
  const showVia = hotdog.eater.toLowerCase() !== hotdog.logger.toLowerCase();

  const isResolved = hotdog.attestationPeriod?.status === 1;
  const isValid = hotdog.attestationPeriod?.isValid ?? false;

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <ScrollView>
        {/* User header */}
        <View className="flex-row items-center px-4 py-3 gap-3">
          <ProfileAvatar
            image={hotdog.eaterProfile?.image}
            address={hotdog.eater}
            size={44}
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-bold text-neutral text-base" numberOfLines={1}>
                {eaterName}
              </Text>
              <ProfileBadge profile={hotdog.eaterProfile} />
            </View>
            {showVia && (
              <Text className="text-neutral/50 text-xs">
                logged by {loggerName}
              </Text>
            )}
            <Text className="text-neutral/40 text-xs">
              {formatTimestamp(hotdog.timestamp)}
            </Text>
          </View>
        </View>

        {/* Image */}
        <View style={{ width, height: imageHeight }}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ flex: 1 }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="flex-1 bg-base-300 items-center justify-center">
              <Text className="text-7xl">🌭</Text>
            </View>
          )}
          {isResolved && <VerdictStamp isValid={isValid} />}
        </View>

        {/* Vote bar */}
        <VoteBar
          logId={hotdog.logId}
          validCount={validAttestations ?? "0"}
          invalidCount={invalidAttestations ?? "0"}
          userHasVoted={userAttested ?? false}
          userVotedValid={userAttestation ?? false}
          attestationStatus={hotdog.attestationPeriod?.status}
          onVoteSuccess={() => query.refetch()}
        />

        {/* AI verdict + live voting countdown */}
        <View className="flex-row items-center gap-3 px-4 pb-1">
          <AiJudgement logId={hotdog.logId} timestamp={hotdog.timestamp} />
          {hotdog.attestationPeriod && !isResolved && (
            <VotingCountdown timestamp={hotdog.timestamp} />
          )}
        </View>

        {/* Metadata */}
        <View className="px-4 pb-8 gap-4">
          {/* Log ID */}
          <View className="flex-row items-center justify-between bg-base-200 rounded-xl px-4 py-3">
            <Text className="text-neutral/50 text-sm">Log ID</Text>
            <Text className="font-mono text-neutral text-sm">#{hotdog.logId}</Text>
          </View>

          {/* Attestation window */}
          {hotdog.attestationPeriod && (
            <View className="bg-base-200 rounded-xl px-4 py-3">
              <Text className="text-neutral/50 text-sm mb-2">Attestation</Text>
              <View className="flex-row justify-between">
                <Text className="text-neutral text-sm">
                  Valid:{" "}
                  <Text className="text-accent font-bold">
                    {hotdog.attestationPeriod.totalValidStake
                      ? `${(BigInt(hotdog.attestationPeriod.totalValidStake) / BigInt(1e24)).toString()}M`
                      : "0"}
                  </Text>
                </Text>
                <Text className="text-neutral text-sm">
                  Sus:{" "}
                  <Text className="text-error font-bold">
                    {hotdog.attestationPeriod.totalInvalidStake
                      ? `${(BigInt(hotdog.attestationPeriod.totalInvalidStake) / BigInt(1e24)).toString()}M`
                      : "0"}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* Zora coin — market stats + trade */}
          {hotdog.zoraCoin && (
            <View className="bg-base-200 rounded-xl px-4 py-3 gap-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-neutral/50 text-xs mb-0.5">Zora Coin</Text>
                  <Text className="text-neutral font-bold text-sm">
                    {hotdog.zoraCoin.symbol ?? "COIN"}
                  </Text>
                </View>
                {typeof hotdog.zoraCoin.uniqueHolders === "number" && (
                  <View className="items-end">
                    <Text className="text-neutral/50 text-xs">Holders</Text>
                    <Text className="text-neutral font-bold text-sm">
                      {hotdog.zoraCoin.uniqueHolders}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row justify-between">
                {hotdog.zoraCoin.marketCap && (
                  <View>
                    <Text className="text-neutral/50 text-xs">Market cap</Text>
                    <Text className="text-info font-bold text-sm">
                      ${formatAbbreviatedFiat(Number(hotdog.zoraCoin.marketCap))}
                    </Text>
                  </View>
                )}
                {hotdog.zoraCoin.volume24h && (
                  <View className="items-end">
                    <Text className="text-neutral/50 text-xs">24h volume</Text>
                    <Text className="text-neutral font-bold text-sm">
                      ${formatAbbreviatedFiat(Number(hotdog.zoraCoin.volume24h))}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://zora.co/coin/base:${hotdog.zoraCoin!.address}`,
                    )
                  }
                  className="flex-1 bg-primary rounded-xl py-2.5 items-center"
                >
                  <Text className="font-bold text-neutral text-sm">
                    ⇄ Trade on Zora
                  </Text>
                </Pressable>
                {hotdog.zoraCoin.link && (
                  <Pressable
                    onPress={() => Linking.openURL(hotdog.zoraCoin!.link!)}
                    className="bg-base-300 rounded-xl py-2.5 px-4 items-center justify-center"
                  >
                    <Text className="text-neutral/70 text-sm font-bold">View</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Duplicate warning */}
          {hotdog.duplicateOfLogId && (
            <View className="bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-3">
              <Text className="text-secondary font-bold text-sm">
                ♻ Duplicate of #{hotdog.duplicateOfLogId}
              </Text>
            </View>
          )}
        </View>

        {/* Comments */}
        <Comments logId={hotdog.logId} />
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import { useAuth } from "~/providers/AuthProvider";
import { VoteBar } from "~/components/VoteBar";
import { VerdictStamp } from "~/components/VerdictStamp";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { COLORS } from "~/constants/colors";
import {
  convertIpfsToHttps,
  formatTimestamp,
  getDisplayName,
  isInAttestationWindow,
} from "~/utils/format";
import type { ProcessedHotdog } from "~/types";

const PAGE_SIZE = 20;

export default function JudgeScreen() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const voterAddress = session?.address;

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

  const { data: userVotes } = trpc.hotdog.getUserVotes.useQuery(
    { voter: voterAddress ?? "" },
    { enabled: !!voterAddress, staleTime: 60_000 },
  );

  const pending = useMemo(() => {
    const hotdogs = (query.data?.hotdogs ?? []) as ProcessedHotdog[];
    const userAttested = query.data?.userAttested ?? [];
    return hotdogs
      .map((h, i) => ({ h, i }))
      .filter(({ h, i }) => {
        const inWindow =
          h.attestationPeriod &&
          h.attestationPeriod.status === 0 &&
          isInAttestationWindow(
            h.attestationPeriod.startTime,
            h.attestationPeriod.endTime,
          );
        const alreadyVoted =
          voterAddress &&
          ((userAttested[i] ?? false) || userVotes?.[h.logId] !== undefined);
        return inWindow && !alreadyVoted;
      })
      .map(({ h }) => h);
  }, [query.data?.hotdogs, query.data?.userAttested, userVotes, voterAddress]);

  const validCounts = query.data?.validAttestations ?? [];
  const invalidCounts = query.data?.invalidAttestations ?? [];
  const userAttested = query.data?.userAttested ?? [];
  const userAttestations = query.data?.userAttestations ?? [];

  const safeIdx = Math.min(currentIdx, Math.max(0, pending.length - 1));
  const dog = pending[safeIdx];
  const allDogs = (query.data?.hotdogs ?? []) as ProcessedHotdog[];
  const globalIdx = dog ? allDogs.findIndex((h) => h.logId === dog.logId) : -1;

  const handleNext = useCallback(() => {
    setCurrentIdx((i) => Math.min(i + 1, pending.length - 1));
  }, [pending.length]);

  const handleVoteSuccess = useCallback(async () => {
    await query.refetch();
    setTimeout(() => {
      setCurrentIdx((i) => Math.min(i + 1, pending.length - 1));
    }, 800);
  }, [query, pending.length]);

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-base-100 items-center justify-center" edges={["bottom"]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text className="text-neutral/60 mt-3">Loading the queue…</Text>
      </SafeAreaView>
    );
  }

  if (pending.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-base-100 items-center justify-center px-8" edges={["bottom"]}>
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="font-display text-neutral text-2xl text-center mb-2">
          ALL CLEAR
        </Text>
        <Text className="text-neutral/60 text-center text-base">
          No dogs waiting for a verdict right now. Check back in a bit!
        </Text>
      </SafeAreaView>
    );
  }

  const imageUri = convertIpfsToHttps(
    dog?.zoraCoin?.mediaContent?.previewImage?.medium ?? dog?.imageUri,
  );
  const eaterName = getDisplayName(dog?.eaterProfile, dog?.eater ?? "");
  const imageHeight = Math.round((width - 32) * (5 / 4));

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      {/* Queue count */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-neutral/60 text-sm">
          Dog {safeIdx + 1} of {pending.length} awaiting verdict
        </Text>
        {pending.length > 1 && (
          <Pressable
            onPress={handleNext}
            className="bg-base-200 rounded-xl px-3 py-1.5"
          >
            <Text className="text-neutral font-bold text-sm">Skip →</Text>
          </Pressable>
        )}
      </View>

      {/* Dog card */}
      {dog && (
        <View className="mx-4 bg-base-200 rounded-3xl overflow-hidden" style={{
          shadowColor: COLORS.secondary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 4,
        }}>
          {/* Header */}
          <View className="flex-row items-center p-3 gap-2">
            <ProfileAvatar
              image={dog.eaterProfile?.image}
              address={dog.eater}
              size={38}
            />
            <View className="flex-1">
              <Text className="font-bold text-neutral text-sm">{eaterName}</Text>
              <Text className="text-xs text-neutral/50">
                {formatTimestamp(dog.timestamp)}
              </Text>
            </View>
          </View>

          {/* Image */}
          <View style={{ width: width - 32, height: imageHeight }}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ flex: 1 }}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View className="flex-1 bg-base-300 items-center justify-center">
                <Text className="text-5xl">🌭</Text>
              </View>
            )}
          </View>

          {/* Vote bar */}
          {globalIdx >= 0 && (
            <VoteBar
              logId={dog.logId}
              validCount={validCounts[globalIdx] ?? "0"}
              invalidCount={invalidCounts[globalIdx] ?? "0"}
              userHasVoted={userAttested[globalIdx] ?? false}
              userVotedValid={userAttestations[globalIdx] ?? false}
              attestationStatus={dog.attestationPeriod?.status}
              onVoteSuccess={handleVoteSuccess}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

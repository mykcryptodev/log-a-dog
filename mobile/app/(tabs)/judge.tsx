import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import { useAuth } from "~/providers/AuthProvider";
import { VoteBar } from "~/components/VoteBar";
import { AiJudgement } from "~/components/AiJudgement";
import { VotingCountdown } from "~/components/VotingCountdown";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { COLORS } from "~/constants/colors";
import { convertIpfsToHttps, formatTimestamp, getDisplayName } from "~/utils/format";
import { isJudgeable } from "@shared/time";
import type { ProcessedHotdog } from "~/types";

const PAGE_SIZE = 50;

interface Judge {
  voter: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
  profile: { username?: string; imgUrl?: string; address?: string };
}

function TopJudges() {
  const { data: judges = [], isLoading } = trpc.hotdog.getJudges.useQuery(
    undefined,
    { refetchOnWindowFocus: false, retry: 1 },
  );

  if (isLoading) {
    return (
      <View className="py-6 items-center">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }
  if ((judges as Judge[]).length === 0) return null;

  return (
    <View className="px-4 pt-2 pb-8">
      <Text className="font-display text-neutral text-xl mb-3 tracking-wide">
        🏅 TOP JUDGES
      </Text>
      <View className="gap-2">
        {(judges as Judge[]).map((j, idx) => (
          <View
            key={j.voter}
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
          </View>
        ))}
      </View>
    </View>
  );
}

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
          voterAddress &&
          ((userAttested[i] ?? false) || userVotes?.[h.logId] !== undefined);
        return open && !alreadyVoted;
      })
      .map(({ h }) => h);
  }, [allDogs, query.data?.userAttested, userVotes, voterAddress]);

  const validCounts = query.data?.validAttestations ?? [];
  const invalidCounts = query.data?.invalidAttestations ?? [];
  const userAttested = query.data?.userAttested ?? [];
  const userAttestations = query.data?.userAttestations ?? [];

  const safeIdx = Math.min(currentIdx, Math.max(0, pending.length - 1));
  const dog = pending[safeIdx];
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
      <SafeAreaView
        className="flex-1 bg-base-100 items-center justify-center"
        edges={["bottom"]}
      >
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text className="text-neutral/60 mt-3">Loading the queue…</Text>
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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {pending.length === 0 ? (
          <View className="items-center justify-center px-8 py-16">
            <Text className="text-6xl mb-4">🎉</Text>
            <Text className="font-display text-neutral text-2xl text-center mb-2">
              ALL CLEAR
            </Text>
            <Text className="text-neutral/60 text-center text-base">
              No dogs waiting for a verdict right now. Check back in a bit!
            </Text>
          </View>
        ) : (
          <>
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
              <View
                className="mx-4 bg-base-200 rounded-3xl overflow-hidden"
                style={{
                  shadowColor: COLORS.secondary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.12,
                  shadowRadius: 20,
                  elevation: 4,
                }}
              >
                {/* Header */}
                <View className="flex-row items-center p-3 gap-2">
                  <ProfileAvatar
                    image={dog.eaterProfile?.image}
                    address={dog.eater}
                    size={38}
                  />
                  <View className="flex-1">
                    <Text className="font-bold text-neutral text-sm">
                      {eaterName}
                    </Text>
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

                {/* AI verdict + countdown */}
                <View className="flex-row items-center gap-3 px-3 pb-3">
                  <AiJudgement logId={dog.logId} timestamp={dog.timestamp} />
                  <VotingCountdown timestamp={dog.timestamp} />
                </View>
              </View>
            )}
          </>
        )}

        {/* Top judges ranking */}
        <View className="mt-6">
          <TopJudges />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { ProfileBadge } from "~/components/ProfileBadge";
import { useLeaderboard } from "~/hooks/useLeaderboard";
import { COLORS } from "~/constants/colors";
import { CONTEST_START_TIME, CONTEST_END_TIME } from "~/constants";
import type { LeaderboardEntry } from "~/types";

const MEDALS = ["🥇", "🥈", "🥉"];

interface Props {
  seasonOnly?: boolean;
}

export function LeaderboardList({ seasonOnly = true }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { startDate, endDate } = useMemo(
    () =>
      seasonOnly
        ? {
            startDate: new Date(CONTEST_START_TIME),
            endDate: new Date(CONTEST_END_TIME),
          }
        : { startDate: undefined, endDate: undefined },
    [seasonOnly],
  );

  // Fetch a deep list (not just the top 10 ticker slice) so search is useful.
  const { entries, isLoading } = useLeaderboard({
    startDate,
    endDate,
    limit: 500,
  });

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.address.toLowerCase().includes(q) ||
        e.profile?.username?.toLowerCase().includes(q) ||
        e.profile?.name?.toLowerCase().includes(q),
    );
  }, [entries, search]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item: LeaderboardEntry) => item.address}
      ListHeaderComponent={
        <View className="px-4 pt-2 pb-3">
          <TextInput
            className="bg-base-200 rounded-xl px-4 py-2.5 text-neutral text-sm"
            placeholder="Search players…"
            placeholderTextColor={COLORS.neutral + "66"}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      }
      renderItem={({ item }: { item: LeaderboardEntry }) => {
        const rank = item.rank;
        const medal = MEDALS[rank - 1] ?? null;
        const isPodium = rank <= 3;

        return (
          <Pressable
            onPress={() =>
              router.push(`/profile/address/${item.address}` as never)
            }
            className={[
              "flex-row items-center px-4 py-3 mx-4 mb-2 rounded-2xl",
              isPodium ? "bg-base-200" : "bg-base-100",
            ].join(" ")}
            style={
              isPodium
                ? {
                    shadowColor: COLORS.secondary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }
                : {}
            }
          >
            <View className="w-10 items-center">
              {medal ? (
                <Text className="text-xl">{medal}</Text>
              ) : (
                <Text className="text-neutral/50 font-bold text-sm">
                  #{rank}
                </Text>
              )}
            </View>
            <ProfileAvatar
              image={item.avatarUrl}
              address={item.address}
              size={40}
            />
            <View className="flex-1 ml-3">
              <View className="flex-row items-center gap-1">
                <Text
                  className="font-bold text-neutral text-sm"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <ProfileBadge profile={item.profile} />
              </View>
              <Text className="text-neutral/50 text-xs">
                {item.count} dog{parseInt(item.count, 10) !== 1 ? "s" : ""}
              </Text>
            </View>
            {isPodium && (
              <View className="bg-primary/20 rounded-xl px-3 py-1">
                <Text className="font-display text-primary text-lg">
                  {item.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View className="items-center py-16">
          <Text className="text-neutral/50">No entries yet.</Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
}

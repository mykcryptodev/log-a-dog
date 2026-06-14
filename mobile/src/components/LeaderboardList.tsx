import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID } from "~/constants";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { getDisplayName } from "~/utils/format";
import { COLORS } from "~/constants/colors";
import { CONTEST_START_TIME, CONTEST_END_TIME } from "~/constants";

const MEDALS = ["🥇", "🥈", "🥉"];

interface Props {
  seasonOnly?: boolean;
}

export function LeaderboardList({ seasonOnly = true }: Props) {
  const [search, setSearch] = useState("");

  const contestStart = useMemo(
    () => Math.floor(new Date(CONTEST_START_TIME).getTime() / 1000),
    [],
  );
  const contestEnd = useMemo(
    () => Math.floor(new Date(CONTEST_END_TIME).getTime() / 1000),
    [],
  );

  const query = trpc.hotdog.getLeaderboard.useQuery({
    chainId: CHAIN_ID,
    ...(seasonOnly ? { startDate: contestStart, endDate: contestEnd } : {}),
  });

  const entries = useMemo(() => {
    const users = query.data?.users ?? [];
    const hotdogs = query.data?.hotdogs ?? [];
    const profiles = query.data?.profiles ?? [];

    const mapped = users.map((address: string, i: number) => ({
      address,
      count: hotdogs[i] ?? "0",
      profile: (profiles[i] as { name?: string | null; username?: string | null; image?: string | null } | null) ?? null,
    }));

    if (!search) return mapped;

    const q = search.toLowerCase();
    return mapped.filter((e) =>
      e.address.toLowerCase().includes(q) ||
      e.profile?.username?.toLowerCase().includes(q) ||
      e.profile?.name?.toLowerCase().includes(q),
    );
  }, [query.data, search]);

  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item: { address: string }) => item.address}
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
      renderItem={({ item, index }: { item: { address: string; count: string; profile: { name?: string | null; username?: string | null; image?: string | null } | null }; index: number }) => {
        const rank = index + 1;
        const name = getDisplayName(item.profile, item.address);
        const medal = MEDALS[index] ?? null;
        const isPodium = rank <= 3;

        return (
          <View
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
              image={item.profile?.image}
              address={item.address}
              size={40}
            />
            <View className="flex-1 ml-3">
              <Text
                className="font-bold text-neutral text-sm"
                numberOfLines={1}
              >
                {name}
              </Text>
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
          </View>
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

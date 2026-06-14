import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import { HotdogCard } from "~/components/HotdogCard";
import type { ProcessedHotdog } from "~/types";
import { useAuth } from "~/providers/AuthProvider";
import { COLORS } from "~/constants/colors";

const PAGE_SIZE = 10;

interface Props {
  userAddress?: string;
  header?: React.ReactElement;
}

export function HotdogFeed({ userAddress, header }: Props) {
  const { session } = useAuth();
  const [page, setPage] = useState(0);

  const query = trpc.hotdog.getAll.useQuery(
    {
      chainId: CHAIN_ID,
      user: userAddress ?? ZERO_ADDRESS,
      start: 0,
      limit: PAGE_SIZE * (page + 1),
    },
    { keepPreviousData: true },
  );

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const loadMore = useCallback(() => {
    if (query.data?.hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [query.data?.hasNextPage]);

  if (query.isLoading && !query.data) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text className="text-neutral/60 mt-3 text-sm">Loading dogs…</Text>
      </View>
    );
  }

  if (query.isError) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-8">
        <Text className="text-error text-center text-base">
          Failed to load the feed. Pull to refresh.
        </Text>
      </View>
    );
  }

  const hotdogs = (query.data?.hotdogs ?? []) as ProcessedHotdog[];
  const validCounts = query.data?.validAttestations ?? [];
  const invalidCounts = query.data?.invalidAttestations ?? [];
  const userAttested = query.data?.userAttested ?? [];
  const userAttestations = query.data?.userAttestations ?? [];

  return (
    <FlashList
      data={hotdogs}
      keyExtractor={(item) => item.logId}
      renderItem={({ item, index }) => (
        <HotdogCard
          hotdog={item}
          validCount={validCounts[index] ?? "0"}
          invalidCount={invalidCounts[index] ?? "0"}
          userHasVoted={userAttested[index] ?? false}
          userVotedValid={userAttestations[index] ?? false}
          onVoteSuccess={refetch}
        />
      )}
      estimatedItemSize={520}
      onRefresh={refetch}
      refreshing={query.isFetching && !!query.data}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View className="items-center justify-center py-20">
          <Text className="text-5xl mb-3">🌭</Text>
          <Text className="text-neutral/60 text-center">
            No dogs logged yet.{"\n"}Be the first to eat a dog!
          </Text>
        </View>
      }
      ListFooterComponent={
        query.data?.hasNextPage ? (
          <View className="py-6 items-center">
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
    />
  );
}

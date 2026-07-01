import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import { HotdogCard } from "~/components/HotdogCard";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import type { GetAllResponse, ProcessedHotdog } from "~/types";
import { buildAttestationMaps, getAttestationData } from "@shared/feed";
import { useAuth } from "~/providers/AuthProvider";
import { COLORS } from "~/constants/colors";

const PAGE_SIZE = 10;

interface Props {
  userAddress?: string;
  header?: React.ReactElement;
}

export function HotdogFeed({ userAddress, header }: Props) {
  const { session } = useAuth();
  const voter = session?.address ?? ZERO_ADDRESS;
  const isMainFeed = !userAddress;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = trpc.hotdog.getAll.useInfiniteQuery(
    {
      chainId: CHAIN_ID,
      user: userAddress ?? ZERO_ADDRESS,
      voter,
      limit: PAGE_SIZE,
    },
    {
      keepPreviousData: true,
      getNextPageParam: (lastPage: GetAllResponse) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  const pages = useMemo(
    () => (query.data?.pages ?? []) as GetAllResponse[],
    [query.data?.pages],
  );

  const hotdogs = useMemo<ProcessedHotdog[]>(
    () => pages.flatMap((p) => p.hotdogs),
    [pages],
  );

  // Build logId -> attestation lookup maps once per data change (shared helper).
  const attestationMaps = useMemo(() => buildAttestationMaps(pages), [pages]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  // Manual "Refresh feed" — pulls new on-chain logs into the DB, then refetches.
  // The backend enforces a per-identity cooldown; surface that as an alert.
  const refreshFeed = trpc.indexer.refreshFeed.useMutation();
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshFeed.mutateAsync({ chainId: CHAIN_ID });
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not refresh right now.";
      Alert.alert("Refresh feed", message);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshFeed, refetch]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  const listHeader = useMemo(() => {
    if (!isMainFeed && !header) return undefined;
    return (
      <View>
        {header}
        {isMainFeed && (
          <View className="px-4 pt-3 gap-3">
            <View className="overflow-hidden rounded-2xl bg-base-100 border border-base-300">
              <LeaderboardBanner scrollSpeed={40} />
            </View>
            <View className="flex-row justify-end">
              <Pressable
                onPress={handleRefresh}
                disabled={isRefreshing}
                className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
              >
                {isRefreshing ? (
                  <ActivityIndicator color={COLORS.secondary} size="small" />
                ) : (
                  <Text className="text-neutral/60 text-sm">↻</Text>
                )}
                <Text className="text-neutral/60 text-sm font-medium">
                  Refresh feed
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  }, [isMainFeed, header, handleRefresh, isRefreshing]);

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
        <Pressable
          onPress={refetch}
          className="mt-4 bg-primary rounded-2xl px-6 py-3"
        >
          <Text className="font-display text-neutral tracking-wide">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlashList
      data={hotdogs}
      keyExtractor={(item) => item.logId}
      renderItem={({ item }) => {
        const a = getAttestationData(item.logId, attestationMaps);
        return (
          <HotdogCard
            hotdog={item}
            validCount={a.validAttestations}
            invalidCount={a.invalidAttestations}
            userHasVoted={a.userAttested}
            userVotedValid={a.userAttestation}
            onVoteSuccess={refetch}
          />
        );
      }}
      estimatedItemSize={520}
      onRefresh={refetch}
      refreshing={query.isFetching && !query.isFetchingNextPage && !!query.data}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <View className="items-center justify-center py-20">
          <Text className="text-5xl mb-3">🌭</Text>
          <Text className="text-neutral/60 text-center">
            No dogs logged yet.{"\n"}Be the first to eat a dog!
          </Text>
        </View>
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View className="py-6 items-center">
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : !query.hasNextPage && hotdogs.length > 0 ? (
          <View className="py-6 items-center">
            <Text className="text-neutral/50 text-sm">
              You&apos;ve reached the end of the grill.
            </Text>
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
    />
  );
}

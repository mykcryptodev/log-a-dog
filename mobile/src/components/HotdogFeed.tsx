import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import { HotdogCard } from "~/components/HotdogCard";
import { LeaderboardBanner } from "~/components/LeaderboardBanner";
import { PreseasonBanner } from "~/components/PreseasonBanner";
import type { GetAllResponse, GetAllForUserResponse, ProcessedHotdog } from "~/types";
import { buildAttestationMaps, getAttestationData } from "@shared/feed";
import { useAuth } from "~/providers/AuthProvider";
import { COLORS } from "~/constants/colors";
import { usePendingDogs, pendingDogsStore } from "~/stores/pendingDogs";

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
  const pending = usePendingDogs(String(CHAIN_ID));

  const mainQuery = trpc.hotdog.getAll.useInfiniteQuery(
    {
      chainId: CHAIN_ID,
      user: ZERO_ADDRESS,
      voter,
      limit: PAGE_SIZE,
    },
    {
      enabled: isMainFeed,
      keepPreviousData: true,
      getNextPageParam: (lastPage: GetAllResponse) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
      refetchInterval: isMainFeed && pending.length > 0 ? 6000 : false,
    },
  );

  const userQuery = trpc.hotdog.getAllForUser.useInfiniteQuery(
    {
      chainId: CHAIN_ID,
      user: userAddress ?? "",
      limit: PAGE_SIZE,
    },
    {
      enabled: !isMainFeed && !!userAddress,
      keepPreviousData: true,
      getNextPageParam: (lastPage: GetAllForUserResponse) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  const query = isMainFeed ? mainQuery : userQuery;

  const pages = useMemo(() => {
    if (!query.data?.pages) return [] as GetAllResponse[];
    if (isMainFeed) return query.data.pages as GetAllResponse[];
    return (query.data.pages as GetAllForUserResponse[]).map((p) => ({
      ...p,
      validAttestations: p.hotdogs.map(() => "0"),
      invalidAttestations: p.hotdogs.map(() => "0"),
      userAttested: p.hotdogs.map(() => false),
      userAttestations: p.hotdogs.map(() => false),
    }));
  }, [query.data?.pages, isMainFeed]);

  const hotdogs = useMemo<ProcessedHotdog[]>(
    () => pages.flatMap((p) => p.hotdogs),
    [pages],
  );

  const loadedImageUris = useMemo(
    () => new Set(hotdogs.map((h) => h.imageUri)),
    [hotdogs],
  );

  // Optimistic pending cards (main feed only), deduped against real rows.
  const pendingCards = useMemo<ProcessedHotdog[]>(() => {
    if (!isMainFeed) return [];
    return pending
      .filter((p) => !loadedImageUris.has(p.imageUri))
      .map((p) => ({
        logId: p.logId,
        imageUri: p.imageUri,
        metadataUri: "",
        timestamp: p.timestamp,
        eater: p.eater,
        logger: p.logger,
        zoraCoin: null,
        metadata: null,
        attestationPeriod: undefined,
        duplicateOfLogId: null,
        eaterProfile: null,
        loggerProfile: null,
      }));
  }, [isMainFeed, pending, loadedImageUris]);

  const data = useMemo<ProcessedHotdog[]>(
    () => (pendingCards.length ? [...pendingCards, ...hotdogs] : hotdogs),
    [pendingCards, hotdogs],
  );

  // Expire stuck pending cards and drop any whose real row has now indexed.
  useEffect(() => {
    pendingDogsStore.clearExpired();
    for (const p of pending) {
      if (loadedImageUris.has(p.imageUri)) {
        pendingDogsStore.remove(p.transactionId);
      }
    }
  }, [pending, loadedImageUris]);

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

  const listHeader = useMemo((): React.ReactElement | null => {
    if (!isMainFeed && !header) return null;
    return (
      <View>
        {header as any}
        {isMainFeed && (
          <View className="px-4 pt-3 gap-3">
            <PreseasonBanner />
            <View
              className="overflow-hidden rounded-2xl bg-base-100"
              style={{ borderWidth: 2.5, borderColor: COLORS.neutral }}
            >
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
      data={data}
      keyExtractor={(item) => item.logId}
      renderItem={({ item }) => {
        const isPending = item.logId.startsWith("pending-");
        const a = getAttestationData(item.logId, attestationMaps);
        return (
          <HotdogCard
            hotdog={item}
            validCount={a.validAttestations}
            invalidCount={a.invalidAttestations}
            userHasVoted={a.userAttested}
            userVotedValid={a.userAttestation}
            onVoteSuccess={refetch}
            pending={isPending}
          />
        );
      }}
      estimatedItemSize={520}
      onRefresh={refetch}
      refreshing={query.isFetching && !query.isFetchingNextPage && !!query.data}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={listHeader as any}
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

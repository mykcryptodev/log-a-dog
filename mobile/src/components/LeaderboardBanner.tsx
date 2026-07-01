import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { ProfileAvatar } from "~/components/ProfileAvatar";
import { ProfileBadge } from "~/components/ProfileBadge";
import { useLeaderboard } from "~/hooks/useLeaderboard";
import { COLORS } from "~/constants/colors";
import type { LeaderboardEntry } from "~/types";

interface Props {
  /** Pixels per second the ticker scrolls. */
  scrollSpeed?: number;
}

function TickerPill({ item }: { item: LeaderboardEntry }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-base-200 px-3 py-1.5">
      <Text className="font-display text-secondary text-sm">{item.rank}</Text>
      <ProfileAvatar
        image={item.avatarUrl}
        address={item.address}
        size={20}
      />
      <Text className="text-neutral text-sm font-medium" numberOfLines={1}>
        {item.name}
      </Text>
      <ProfileBadge profile={item.profile} />
      <Text className="font-display text-primary text-sm">
        {item.count}🌭
      </Text>
    </View>
  );
}

function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View className="flex-row items-center gap-1.5 border-r border-base-300 bg-base-100 px-3 h-full">
      <Animated.View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: COLORS.secondary,
          opacity: pulse,
        }}
      />
      <Text className="font-display text-secondary text-xs tracking-wider">
        LIVE
      </Text>
    </View>
  );
}

/**
 * Auto-scrolling scoreboard ticker for the top of the feed — the mobile
 * counterpart to the web `LeaderboardBanner`. Shows the all-time top dogs and
 * loops seamlessly by rendering two copies of the pill row.
 */
export function LeaderboardBanner({ scrollSpeed = 40 }: Props) {
  const { entries, isLoading } = useLeaderboard({ limit: 10 });
  const translateX = useRef(new Animated.Value(0)).current;
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    if (setWidth <= 0) return;
    translateX.setValue(0);
    const duration = (setWidth / scrollSpeed) * 1000;
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -setWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [setWidth, scrollSpeed, translateX]);

  const onSetLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - setWidth) > 1) setSetWidth(w);
  };

  if (isLoading) {
    return (
      <View className="h-12 flex-row items-stretch overflow-hidden">
        <LiveBadge />
        <View className="flex-1 bg-base-200" />
      </View>
    );
  }

  if (entries.length === 0) return null;

  return (
    <View className="h-12 flex-row items-stretch overflow-hidden">
      <LiveBadge />
      <View className="flex-1 overflow-hidden justify-center">
        <Animated.View
          style={{ flexDirection: "row", transform: [{ translateX }] }}
        >
          {/* First (measured) copy */}
          <View
            className="flex-row items-center gap-2 px-2"
            onLayout={onSetLayout}
          >
            {entries.map((item) => (
              <TickerPill key={`a-${item.address}`} item={item} />
            ))}
          </View>
          {/* Second copy for a seamless loop */}
          <View className="flex-row items-center gap-2 px-2">
            {entries.map((item) => (
              <TickerPill key={`b-${item.address}`} item={item} />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

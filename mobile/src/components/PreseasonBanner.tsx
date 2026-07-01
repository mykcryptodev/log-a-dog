import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSeasonInfo } from "@shared/season";

const STORAGE_KEY = "preseason-banner-dismissed";

/**
 * Dismissible pre-season notice shown on the feed until the contest goes live —
 * the mobile counterpart to the web PreseasonBanner.
 */
export function PreseasonBanner() {
  const { isLive } = getSeasonInfo();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) =>
      setDismissed(v === "true"),
    );
  }, []);

  if (isLive || dismissed) return null;

  const dismiss = () => {
    void AsyncStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <View className="flex-row items-center justify-between bg-primary rounded-2xl px-4 py-3">
      <Text className="font-display text-neutral text-sm tracking-wide flex-1">
        🌭 PRE-SEASON: Competition kicks off July 4th
      </Text>
      <Pressable onPress={dismiss} hitSlop={8}>
        <Text className="text-neutral/60 text-base ml-3">✕</Text>
      </Pressable>
    </View>
  );
}

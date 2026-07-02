import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const STORAGE_KEY = "poidh-banner-dismissed";

/**
 * Dismissible POIDH campaign banner on the feed — links to the campaign page.
 */
export function PoidhBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) =>
      setDismissed(v === "true"),
    );
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    void AsyncStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <View className="flex-row items-center justify-between bg-primary rounded-2xl px-4 py-3">
      <Pressable
        onPress={() => router.push("/poidh")}
        className="flex-1 flex-row items-center justify-between"
      >
        <Text className="font-display text-neutral text-sm tracking-wide flex-1">
          🕹️ POIDH Campaign · Win $50 ETH/day
        </Text>
        <Text className="text-neutral/60 text-sm ml-2">→</Text>
      </Pressable>
      <Pressable onPress={dismiss} hitSlop={8}>
        <Text className="text-neutral/60 text-base ml-3">✕</Text>
      </Pressable>
    </View>
  );
}

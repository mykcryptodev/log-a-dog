import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HotdogFeed } from "~/components/HotdogFeed";

export default function FeedScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <HotdogFeed />
    </SafeAreaView>
  );
}

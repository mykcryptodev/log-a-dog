import React from "react";
import { View } from "react-native";
import { HotdogFeed } from "~/components/HotdogFeed";

export default function FeedScreen() {
  return (
    <View className="flex-1 bg-base-100">
      <HotdogFeed />
    </View>
  );
}

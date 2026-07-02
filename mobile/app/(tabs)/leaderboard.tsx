import React from "react";
import { View } from "react-native";
import { LeaderboardList } from "~/components/LeaderboardList";

export default function LeaderboardScreen() {
  return (
    <View className="flex-1 bg-base-100">
      <LeaderboardList seasonOnly />
    </View>
  );
}

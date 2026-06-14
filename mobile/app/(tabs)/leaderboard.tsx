import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LeaderboardList } from "~/components/LeaderboardList";
import { COLORS } from "~/constants/colors";

export default function LeaderboardScreen() {
  const [seasonOnly, setSeasonOnly] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      {/* Season / All-time toggle */}
      <View className="flex-row mx-4 my-3 bg-base-200 rounded-xl p-1">
        <Pressable
          onPress={() => setSeasonOnly(true)}
          className={[
            "flex-1 rounded-lg py-2 items-center",
            seasonOnly ? "bg-primary" : "bg-transparent",
          ].join(" ")}
        >
          <Text
            className={[
              "font-bold text-sm",
              seasonOnly ? "text-neutral" : "text-neutral/60",
            ].join(" ")}
          >
            Season
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSeasonOnly(false)}
          className={[
            "flex-1 rounded-lg py-2 items-center",
            !seasonOnly ? "bg-primary" : "bg-transparent",
          ].join(" ")}
        >
          <Text
            className={[
              "font-bold text-sm",
              !seasonOnly ? "text-neutral" : "text-neutral/60",
            ].join(" ")}
          >
            All Time
          </Text>
        </Pressable>
      </View>

      <LeaderboardList seasonOnly={seasonOnly} />
    </SafeAreaView>
  );
}

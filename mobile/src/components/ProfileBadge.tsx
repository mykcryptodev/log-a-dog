import React from "react";
import { Text, View } from "react-native";
import type { HotdogProfile } from "~/types";

interface Props {
  profile?: HotdogProfile | null;
}

export function ProfileBadge({ profile }: Props) {
  if (!profile) return null;

  if (profile.isDisqualified) {
    return (
      <View className="bg-error/10 rounded-full px-2 py-0.5">
        <Text className="text-error text-xs font-bold">⊘ DQ</Text>
      </View>
    );
  }
  if (profile.isReportedForSpam) {
    return (
      <View className="bg-secondary/10 rounded-full px-2 py-0.5">
        <Text className="text-secondary text-xs font-bold">🚩</Text>
      </View>
    );
  }
  if (profile.isKnownSpammer) {
    return (
      <View className="bg-secondary/10 rounded-full px-2 py-0.5">
        <Text className="text-secondary text-xs font-bold">⚠️</Text>
      </View>
    );
  }
  if (profile.fid) {
    return (
      <View className="bg-info/10 rounded-full px-2 py-0.5">
        <Text className="text-info text-xs font-bold">✓</Text>
      </View>
    );
  }
  return null;
}

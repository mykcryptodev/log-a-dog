import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { HotdogProfile } from "~/types";
import { API_URL } from "~/constants";

interface Props {
  profile?: HotdogProfile | null;
  address?: string;
}

export function ProfileBadge({ profile, address }: Props) {
  const [reporting, setReporting] = useState(false);
  const targetAddress = address ?? profile?.address;

  if (!profile) return null;

  const reportSpam = async () => {
    if (!targetAddress) return;
    setReporting(true);
    try {
      const res = await fetch(`${API_URL}/api/report-spam-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: targetAddress,
          reason: "Reported from mobile app",
        }),
      });
      if (res.ok) {
        Alert.alert("Reported", "Thank you — we'll review this user.");
      } else {
        Alert.alert("Error", "Could not submit report.");
      }
    } catch {
      Alert.alert("Error", "Could not submit report.");
    } finally {
      setReporting(false);
    }
  };

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
      <Pressable
        onPress={() => {
          Alert.alert(
            "Verified on Farcaster",
            `FID ${profile.fid}. Report if this user is not acting in good faith.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: reporting ? "..." : "Report",
                style: "destructive",
                onPress: () => void reportSpam(),
              },
            ],
          );
        }}
        className="bg-info/10 rounded-full px-2 py-0.5"
      >
        <Text className="text-info text-xs font-bold">✓</Text>
      </Pressable>
    );
  }
  return null;
}

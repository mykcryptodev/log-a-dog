import React from "react";
import { Switch, Text, View } from "react-native";
import { trpc } from "~/utils/trpc";
import { COLORS } from "~/constants/colors";

interface Props {
  address: string;
  fid?: number | null;
}

/**
 * Farcaster notification toggle (mobile counterpart to the web Notifications
 * Settings). Only Farcaster-verified users can receive mini-app notifications,
 * so it renders nothing without an fid.
 */
export function NotificationsSettings({ address, fid }: Props) {
  const stateQuery = trpc.user.getNotificationState.useQuery(
    { address },
    { enabled: !!address, refetchOnWindowFocus: false },
  );
  const toggle = trpc.user.toggleNotifications.useMutation({
    onSuccess: () => {
      void stateQuery.refetch();
    },
  });

  if (!fid) return null;

  const enabled = Boolean(stateQuery.data);

  return (
    <View className="mt-3 bg-base-200 rounded-xl px-4 py-3 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-neutral font-bold text-sm">🔔 Notifications</Text>
        <Text className="text-neutral/50 text-xs">
          Get Farcaster alerts about your dogs and verdicts.
        </Text>
      </View>
      <Switch
        value={enabled}
        disabled={toggle.isLoading}
        onValueChange={(v) => toggle.mutate({ enabled: v })}
        trackColor={{ true: COLORS.accent, false: COLORS.base300 }}
        thumbColor={COLORS.white}
      />
    </View>
  );
}

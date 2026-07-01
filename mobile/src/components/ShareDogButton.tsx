import React from "react";
import { Pressable, Share, Text } from "react-native";
import { API_URL } from "~/constants";

interface Props {
  logId: string;
  message?: string;
}

export function ShareDogButton({ logId, message }: Props) {
  const url = `${API_URL}/dog/${logId}`;
  const shareMessage = message ?? `Check out this hotdog log on Log a Dog 🌭\n${url}`;

  const onShare = () => {
    void Share.share({ message: shareMessage, url });
  };

  return (
    <Pressable
      onPress={onShare}
      className="bg-base-200 rounded-full px-3 py-1.5"
    >
      <Text className="text-neutral/70 text-xs font-bold">Share ↗</Text>
    </Pressable>
  );
}

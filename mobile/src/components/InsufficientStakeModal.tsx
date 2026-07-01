import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function InsufficientStakeModal({ visible, onClose }: Props) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View className="bg-base-100 rounded-2xl p-6 w-full max-w-sm">
          <Text className="font-bold text-neutral text-lg mb-2">
            Insufficient Stake
          </Text>
          <Text className="text-neutral/60 text-sm mb-4">
            You need at least 300,000 $HOTDOG staked to vote. Stake tokens on the
            Earn tab to participate.
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onClose}
              className="flex-1 bg-base-200 rounded-xl py-3 items-center"
            >
              <Text className="font-bold text-neutral">Close</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onClose();
                router.push("/(tabs)/earn");
              }}
              className="flex-1 bg-primary rounded-xl py-3 items-center"
            >
              <Text className="font-bold text-neutral">Earn</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID } from "~/constants";
import { useAuth } from "~/providers/AuthProvider";
import { COLORS } from "~/constants/colors";

interface Props {
  existingUsername?: string | null;
  existingImgUrl?: string | null;
  onSaved?: () => void;
}

export function ProfileForm({
  existingUsername,
  existingImgUrl,
  onSaved,
}: Props) {
  const { session } = useAuth();
  const [username, setUsername] = useState(existingUsername ?? "");
  const [imgUrl, setImgUrl] = useState(existingImgUrl ?? "");

  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      Alert.alert("Saved", "Profile updated.");
      onSaved?.();
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    },
  });

  if (session?.fid) {
    return (
      <View className="bg-info/10 rounded-xl px-3 py-2 mb-3">
        <Text className="text-info text-xs">
          Farcaster-verified profiles are managed through Warpcast.
        </Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!session?.address) return;
    createProfile.mutate({
      chainId: CHAIN_ID,
      address: session.address,
      username: username.trim(),
      imgUrl: imgUrl.trim() || "",
      metadata: "",
    });
  };

  return (
    <View className="bg-base-200 rounded-2xl p-4 mb-4">
      <Text className="font-bold text-neutral mb-3">Edit Profile</Text>
      <Text className="text-neutral/60 text-xs mb-1">Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        className="bg-base-100 rounded-xl px-4 py-3 text-neutral mb-3"
        placeholderTextColor="#999"
      />
      <Text className="text-neutral/60 text-xs mb-1">Avatar URL</Text>
      <TextInput
        value={imgUrl}
        onChangeText={setImgUrl}
        autoCapitalize="none"
        className="bg-base-100 rounded-xl px-4 py-3 text-neutral mb-3"
        placeholder="https://..."
        placeholderTextColor="#999"
      />
      <Pressable
        onPress={handleSave}
        disabled={createProfile.isLoading || !username.trim()}
        className="bg-primary rounded-xl py-3 items-center"
      >
        {createProfile.isLoading ? (
          <ActivityIndicator color={COLORS.neutral} />
        ) : (
          <Text className="font-bold text-neutral">Save Profile</Text>
        )}
      </Pressable>
    </View>
  );
}

import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { trpc } from "~/utils/trpc";
import { useAuth } from "~/providers/AuthProvider";
import { CHAIN_ID } from "~/constants";
import { COLORS } from "~/constants/colors";
import { uploadImageToIPFS, uploadMetadataToIPFS } from "~/utils/upload";
import { pendingDogsStore } from "~/stores/pendingDogs";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step =
  | "idle"
  | "checking-safety"
  | "uploading-image"
  | "uploading-metadata"
  | "logging"
  | "success";

const STEP_LABELS: Record<Step, string> = {
  idle: "Log a Dog",
  "checking-safety": "Checking image…",
  "uploading-image": "Uploading to IPFS…",
  "uploading-metadata": "Preparing metadata…",
  logging: "Logging onchain…",
  success: "Logged! 🎉",
};

export function LogModal({ visible, onClose, onSuccess }: Props) {
  const { session } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const successScale = useRef(new Animated.Value(0)).current;

  const checkSafetyMutation = trpc.hotdog.checkForSafety.useMutation();
  const refreshFeed = trpc.indexer.refreshFeed.useMutation();
  const logMutation = trpc.hotdog.log.useMutation({
    onSuccess: () => {
      setStep("success");
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    },
    onError: (err: Error) => {
      setStep("idle");
      Alert.alert("Error", err.message ?? "Failed to log dog.");
    },
  });

  const pickImage = useCallback(async (useCamera: boolean) => {
    const method = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await method({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!session) {
      Alert.alert("Sign In Required", "Please sign in to log a dog.");
      return;
    }
    if (!imageUri) {
      Alert.alert("No Image", "Please select a photo of your hotdog.");
      return;
    }

    try {
      // Read local image as base64 for safety check (no network round-trip needed)
      setStep("checking-safety");
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const base64WithPrefix = `data:image/jpeg;base64,${base64}`;

      const isSafe = await checkSafetyMutation.mutateAsync({
        base64ImageString: base64WithPrefix,
      });

      if (!isSafe) {
        setStep("idle");
        Alert.alert(
          "Image Rejected",
          "This image didn't pass our content check. Please use a hotdog photo.",
        );
        return;
      }

      // Upload image to IPFS
      setStep("uploading-image");
      const ipfsImageUri = await uploadImageToIPFS(imageUri);

      // Upload metadata
      setStep("uploading-metadata");
      const metadataUri = await uploadMetadataToIPFS({
        name: "Logged Dog",
        description: description.trim() || "Logging dogs onchain",
        image: ipfsImageUri,
      });

      // Log onchain via server wallet
      setStep("logging");
      const result = await logMutation.mutateAsync({
        chainId: CHAIN_ID,
        imageUri: ipfsImageUri,
        metadataUri,
        description: description.trim() || undefined,
      });

      // Optimistically show a pending card in the feed until the real on-chain
      // row indexes (deduped by imageUri in the feed).
      const txId: string | undefined = result?.transactionId;
      if (txId && session.address) {
        pendingDogsStore.add({
          transactionId: txId,
          logId: `pending-${txId}`,
          imageUri: ipfsImageUri,
          eater: session.address,
          logger: session.address,
          timestamp:
            (result?.optimisticData?.timestamp as string | undefined) ??
            String(Math.floor(Date.now() / 1000)),
          chainId: String(CHAIN_ID),
          isPending: true,
        });
        // Pull the new log into the DB so the feed's next refetch replaces the
        // optimistic card with the real row.
        void refreshFeed.mutateAsync({ chainId: CHAIN_ID }).catch(() => {
          /* cooldown / offline — the feed poll will still pick it up */
        });
      }
    } catch (err) {
      setStep("idle");
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (!msg.includes("cancelled")) {
        Alert.alert("Error", msg);
      }
    }
  }, [session, imageUri, description, checkSafetyMutation, logMutation]);

  const handleClose = useCallback(() => {
    setImageUri(null);
    setDescription("");
    setStep("idle");
    successScale.setValue(0);
    onClose();
  }, [onClose, successScale]);

  const isProcessing = step !== "idle" && step !== "success";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-base-100">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-base-300">
          <Pressable onPress={handleClose} className="p-1" disabled={isProcessing}>
            <Text className={["text-base", isProcessing ? "text-neutral/30" : "text-neutral/60"].join(" ")}>
              Cancel
            </Text>
          </Pressable>
          <Text className="font-display text-xl text-neutral tracking-wider">
            LOG A DOG
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image picker */}
          <Pressable
            onPress={() => !isProcessing && pickImage(false)}
            className="bg-base-200 rounded-3xl overflow-hidden items-center justify-center mb-3"
            style={{ aspectRatio: 4 / 5 }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                contentFit="cover"
              />
            ) : (
              <View className="items-center gap-3">
                <Text className="text-6xl">📸</Text>
                <Text className="text-neutral/60 font-bold text-base">
                  Tap to add your dog photo
                </Text>
              </View>
            )}
          </Pressable>

          <View className="flex-row gap-2 mb-5">
            <Pressable
              onPress={() => !isProcessing && pickImage(false)}
              className="flex-1 bg-base-200 rounded-xl py-3 items-center"
            >
              <Text className="text-neutral font-bold text-sm">📷 Gallery</Text>
            </Pressable>
            <Pressable
              onPress={() => !isProcessing && pickImage(true)}
              className="flex-1 bg-base-200 rounded-xl py-3 items-center"
            >
              <Text className="text-neutral font-bold text-sm">🤳 Camera</Text>
            </Pressable>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-neutral/60 text-xs font-bold mb-2 uppercase tracking-wider">
              Description (optional)
            </Text>
            <TextInput
              className="bg-base-200 rounded-xl px-4 py-3 text-neutral text-sm"
              placeholder="Describe your hotdog…"
              placeholderTextColor={COLORS.neutral + "66"}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isProcessing}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!imageUri || isProcessing}
            className={[
              "rounded-2xl py-4 items-center justify-center",
              imageUri && !isProcessing ? "bg-primary" : "bg-base-300",
            ].join(" ")}
          >
            {isProcessing ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color={COLORS.neutral} size="small" />
                <Text className="font-bold text-neutral text-base">
                  {STEP_LABELS[step]}
                </Text>
              </View>
            ) : (
              <Text className="font-display text-neutral text-xl tracking-wider">
                {step === "success" ? "🎉 LOGGED!" : "🌭 LOG IT"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

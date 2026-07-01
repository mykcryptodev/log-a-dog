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
import { compressImageForUpload, normalizeImageUri } from "~/utils/image";
import { PopButton, INK } from "~/components/ui/Pop";

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

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 5],
  quality: 0.85,
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
    onError: (err) => {
      setStep("idle");
      Alert.alert("Error", err.message ?? "Failed to log dog.");
    },
  });

  const requestPickerPermission = useCallback(async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.granted) return true;

    Alert.alert(
      useCamera ? "Camera Permission Needed" : "Photo Permission Needed",
      useCamera
        ? "Allow camera access so you can snap a hotdog photo."
        : "Allow photo access so you can choose a hotdog photo.",
    );
    return false;
  }, []);

  const pickImage = useCallback(async (useCamera: boolean) => {
    const hasPermission = await requestPickerPermission(useCamera);
    if (!hasPermission) return;

    try {
      const method = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await method(PICKER_OPTIONS);

      if (!result.canceled && result.assets[0]) {
        const normalized = await normalizeImageUri(result.assets[0].uri);
        setImageUri(normalized);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      Alert.alert(
        useCamera ? "Camera Unavailable" : "Photo Library Unavailable",
        msg || "Please try again or choose a photo from another source.",
      );
    }
  }, [requestPickerPermission]);

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
      // Shrink to ≤0.5MB first (same as the web Upload component) — a full-res
      // base64 photo exceeds the API body limit and the plain-text error
      // response surfaces as "JSON Parse error".
      setStep("checking-safety");
      const uploadUri = await compressImageForUpload(imageUri);
      const base64 = await FileSystem.readAsStringAsync(uploadUri, {
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

      // Upload the compressed image to IPFS (web uploads the resized file too)
      setStep("uploading-image");
      const ipfsImageUri = await uploadImageToIPFS(uploadUri);

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
  }, [session, imageUri, description, checkSafetyMutation, refreshFeed, logMutation]);

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
        <View
          className="flex-row items-center justify-between px-4 pt-4 pb-3"
          style={{ borderBottomWidth: 3, borderBottomColor: INK }}
        >
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
          {/* Image picker — framed like the web card photo (pop-frame) */}
          <Pressable
            onPress={() => !isProcessing && pickImage(false)}
            className="bg-base-200 rounded-3xl overflow-hidden items-center justify-center mb-3"
            style={{ aspectRatio: 4 / 5, borderWidth: 3, borderColor: INK }}
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

          <View className="flex-row mb-5" style={{ gap: 10 }}>
            <PopButton
              onPress={() => !isProcessing && pickImage(false)}
              radius={12}
              backgroundColor={COLORS.base200}
              style={{ flex: 1 }}
              contentStyle={{ paddingVertical: 10, alignItems: "center" }}
            >
              <Text className="text-neutral font-bold text-sm">📷 Gallery</Text>
            </PopButton>
            <PopButton
              onPress={() => !isProcessing && pickImage(true)}
              radius={12}
              backgroundColor={COLORS.base200}
              style={{ flex: 1 }}
              contentStyle={{ paddingVertical: 10, alignItems: "center" }}
            >
              <Text className="text-neutral font-bold text-sm">🤳 Camera</Text>
            </PopButton>
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
          <PopButton
            onPress={handleSubmit}
            disabled={!imageUri || isProcessing}
            radius={16}
            contentStyle={{ paddingVertical: 15, alignItems: "center", justifyContent: "center" }}
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
          </PopButton>
        </ScrollView>
      </View>
    </Modal>
  );
}

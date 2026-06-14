import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "~/providers/AuthProvider";
import { COLORS } from "~/constants/colors";

type Mode = "choose" | "email" | "email-verify";

export default function SignInScreen() {
  const { signInWithFarcaster, signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyFn, setVerifyFn] = useState<((code: string) => Promise<void>) | null>(null);

  const navigate = () => router.replace("/(tabs)/profile");

  const wrap = async (label: string, fn: () => Promise<void>) => {
    setIsLoading(true);
    setLoadingLabel(label);
    try {
      await fn();
      navigate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
      setLoadingLabel("");
    }
  };

  const handleFarcaster = () =>
    wrap("Opening Warpcast…", signInWithFarcaster);

  const handleGoogle = () =>
    wrap("Signing in with Google…", signInWithGoogle);

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setLoadingLabel("Sending code…");
    try {
      const result = await signInWithEmail(email.trim());
      if (result?.requiresVerification) {
        setVerifyFn(() => result.verify);
        setMode("email-verify");
      } else {
        navigate();
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsLoading(false);
      setLoadingLabel("");
    }
  };

  const handleVerifyCode = () => {
    if (!verifyFn || !verifyCode.trim()) return;
    wrap("Verifying…", () => verifyFn(verifyCode.trim()));
  };

  if (mode === "email-verify") {
    return (
      <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-1 px-6 pt-10 gap-4">
            <Text className="font-display text-neutral text-3xl tracking-wider">
              CHECK YOUR EMAIL
            </Text>
            <Text className="text-neutral/60 text-base">
              We sent a 6-digit code to {email}. Enter it below.
            </Text>
            <TextInput
              className="bg-base-200 rounded-xl px-4 py-4 text-neutral text-center text-2xl tracking-widest"
              placeholder="000000"
              placeholderTextColor={COLORS.neutral + "40"}
              value={verifyCode}
              onChangeText={setVerifyCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <Pressable
              onPress={handleVerifyCode}
              disabled={isLoading || verifyCode.length < 6}
              className={[
                "rounded-2xl py-4 items-center",
                !isLoading && verifyCode.length >= 6 ? "bg-primary" : "bg-base-300",
              ].join(" ")}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.neutral} />
              ) : (
                <Text className="font-display text-neutral text-xl tracking-wider">
                  VERIFY
                </Text>
              )}
            </Pressable>
            <Pressable onPress={() => setMode("email")}>
              <Text className="text-neutral/50 text-center text-sm">← Back</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (mode === "email") {
    return (
      <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-1 px-6 pt-10 gap-4">
            <Text className="font-display text-neutral text-3xl tracking-wider">
              SIGN IN BY EMAIL
            </Text>
            <TextInput
              className="bg-base-200 rounded-xl px-4 py-4 text-neutral text-base"
              placeholder="you@example.com"
              placeholderTextColor={COLORS.neutral + "40"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <Pressable
              onPress={handleEmailSubmit}
              disabled={isLoading || !email.trim()}
              className={[
                "rounded-2xl py-4 items-center",
                !isLoading && email.trim() ? "bg-primary" : "bg-base-300",
              ].join(" ")}
            >
              {isLoading ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator color={COLORS.neutral} size="small" />
                  <Text className="font-bold text-neutral">{loadingLabel}</Text>
                </View>
              ) : (
                <Text className="font-display text-neutral text-xl tracking-wider">
                  SEND CODE
                </Text>
              )}
            </Pressable>
            <Pressable onPress={() => setMode("choose")}>
              <Text className="text-neutral/50 text-center text-sm">← Back</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 32, flexGrow: 1 }}
      >
        {/* Hero */}
        <View className="items-center mb-10">
          <Text className="text-7xl mb-4">🌭</Text>
          <Text className="font-display text-neutral text-4xl text-center tracking-wider mb-2">
            LOG A DOG
          </Text>
          <Text className="text-neutral/60 text-center text-base">
            The internet's summer hotdog-eating sport
          </Text>
        </View>

        {/* Auth options */}
        <View className="gap-3 mb-8">
          {/* Farcaster — primary */}
          <Pressable
            onPress={handleFarcaster}
            disabled={isLoading}
            className="bg-primary rounded-2xl py-5 items-center"
          >
            {isLoading && loadingLabel.includes("Warpcast") ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color={COLORS.neutral} size="small" />
                <Text className="font-bold text-neutral">{loadingLabel}</Text>
              </View>
            ) : (
              <Text className="font-display text-neutral text-xl tracking-wider">
                SIGN IN WITH FARCASTER
              </Text>
            )}
          </Pressable>

          {/* Google */}
          <Pressable
            onPress={handleGoogle}
            disabled={isLoading}
            className="bg-base-200 rounded-2xl py-4 items-center border border-base-300"
          >
            {isLoading && loadingLabel.includes("Google") ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color={COLORS.neutral} size="small" />
                <Text className="font-bold text-neutral">{loadingLabel}</Text>
              </View>
            ) : (
              <Text className="font-bold text-neutral text-base">
                🔵 Continue with Google
              </Text>
            )}
          </Pressable>

          {/* Email */}
          <Pressable
            onPress={() => setMode("email")}
            disabled={isLoading}
            className="bg-base-200 rounded-2xl py-4 items-center border border-base-300"
          >
            <Text className="font-bold text-neutral text-base">
              ✉️ Continue with Email
            </Text>
          </Pressable>
        </View>

        <Text className="text-neutral/40 text-xs text-center">
          Wallet powered by Thirdweb. By signing in you agree to eat responsibly.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

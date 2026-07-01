import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThirdwebProvider } from "thirdweb/react";
import { AuthProvider } from "~/providers/AuthProvider";
import { WalletProvider } from "~/providers/WalletProvider";
import { TRPCProvider } from "~/providers/TRPCProvider";
import { COLORS } from "~/constants/colors";

SplashScreen.preventAutoHideAsync();

// Web header/nav bars sit on a 3px ink rule (border-base-content); native
// headers can't take a border directly, so paint it into the background.
const headerWithInkRule = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: COLORS.base100,
      borderBottomWidth: 3,
      borderBottomColor: COLORS.neutral,
    }}
  />
);

export default function RootLayout() {
  // Segment is the web app's brand font (public/fonts/Segment) — load the
  // same faces so typography matches across platforms.
  const [fontsLoaded] = useFonts({
    "Segment-Bold": require("../assets/fonts/Segment-Bold.otf"),
    "Segment-Medium": require("../assets/fonts/Segment-Medium.otf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThirdwebProvider>
        <AuthProvider>
          <WalletProvider>
            <TRPCProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerBackground: headerWithInkRule,
                  headerTintColor: COLORS.neutral,
                  headerShadowVisible: false,
                  headerTitleStyle: {
                    fontFamily: "Segment-Bold",
                    fontSize: 17,
                  },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="dog/[logId]"
                  options={{ headerTitle: "DOG DETAILS" }}
                />
                <Stack.Screen
                  name="sign-in"
                  options={{ headerTitle: "SIGN IN", presentation: "modal" }}
                />
                <Stack.Screen
                  name="rules"
                  options={{ headerTitle: "HOW IT WORKS" }}
                />
                <Stack.Screen
                  name="faq"
                  options={{ headerTitle: "FAQ & RULES" }}
                />
                <Stack.Screen
                  name="profile/address/[address]"
                  options={{ headerTitle: "PROFILE" }}
                />
                <Stack.Screen
                  name="profile/[username]"
                  options={{ headerTitle: "PROFILE" }}
                />
                <Stack.Screen
                  name="profile/id/[id]"
                  options={{ headerTitle: "PROFILE" }}
                />
                <Stack.Screen
                  name="poidh"
                  options={{ headerTitle: "POIDH CAMPAIGN" }}
                />
              </Stack>
            </TRPCProvider>
          </WalletProvider>
        </AuthProvider>
      </ThirdwebProvider>
    </GestureHandlerRootView>
  );
}

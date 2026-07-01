import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { AuthProvider } from "~/providers/AuthProvider";
import { TRPCProvider } from "~/providers/TRPCProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Anton_400Regular });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThirdwebProvider>
      <AuthProvider>
        <TRPCProvider>
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="dog/[logId]"
              options={{
                headerTitle: "Dog Details",
                headerStyle: { backgroundColor: "#FFF8EC" },
                headerTintColor: "#1E1A17",
                headerTitleStyle: {
                  fontFamily: "Anton_400Regular",
                  letterSpacing: 1,
                },
              }}
            />
            <Stack.Screen
              name="sign-in"
              options={{
                headerTitle: "Sign In",
                headerStyle: { backgroundColor: "#FFF8EC" },
                headerTintColor: "#1E1A17",
                headerTitleStyle: {
                  fontFamily: "Anton_400Regular",
                  letterSpacing: 1,
                },
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="rules"
              options={{
                headerTitle: "How It Works",
                headerStyle: { backgroundColor: "#FFF8EC" },
                headerTintColor: "#1E1A17",
                headerTitleStyle: {
                  fontFamily: "Anton_400Regular",
                  letterSpacing: 1,
                },
              }}
            />
            <Stack.Screen
              name="faq"
              options={{
                headerTitle: "FAQ & Rules",
                headerStyle: { backgroundColor: "#FFF8EC" },
                headerTintColor: "#1E1A17",
                headerTitleStyle: {
                  fontFamily: "Anton_400Regular",
                  letterSpacing: 1,
                },
              }}
            />
            <Stack.Screen
              name="profile/address/[address]"
              options={{
                headerTitle: "Profile",
                headerStyle: { backgroundColor: "#FFF8EC" },
                headerTintColor: "#1E1A17",
                headerTitleStyle: {
                  fontFamily: "Anton_400Regular",
                  letterSpacing: 1,
                },
              }}
            />
            <Stack.Screen
              name="poidh"
              options={{
                headerTitle: "POIDH Campaign",
                headerStyle: { backgroundColor: "#FFF8EC" },
                headerTintColor: "#1E1A17",
                headerTitleStyle: {
                  fontFamily: "Anton_400Regular",
                  letterSpacing: 1,
                },
              }}
            />
          </Stack>
        </TRPCProvider>
      </AuthProvider>
    </ThirdwebProvider>
  );
}

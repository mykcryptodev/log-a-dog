import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogModal } from "~/components/LogModal";
import { COLORS } from "~/constants/colors";
import { useRulesOnboarding } from "~/hooks/useRulesOnboarding";

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { tabBarLabel?: string } }>;
  navigation: { emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean }; navigate: (name: string) => void };
}

// Mirrors the web BottomNav: Feed · Leaderboard · [raised Log button] · Judge · You
const TAB_CONFIG = [
  { name: "index", icon: "🌭", label: "Feed" },
  { name: "leaderboard", icon: "🏆", label: "Leaderboard" },
  { name: "_log", icon: "🌭", label: "Log", isFab: true },
  { name: "judge", icon: "🧑‍⚖️", label: "Judge" },
  { name: "profile", icon: "👤", label: "You" },
];

function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [logModalVisible, setLogModalVisible] = useState(false);

  return (
    <>
      {/* Web BottomNav: border-t-[3px] border-base-content bg-base-100 */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: COLORS.base100,
          borderTopWidth: 3,
          borderTopColor: COLORS.neutral,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
          paddingHorizontal: 8,
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const routeIdx = tab.isFab ? -1 : state.routes.findIndex((r) => r.name === tab.name);
          const isFocused = !tab.isFab && state.index === routeIdx;

          const onPress = () => {
            if (tab.isFab) {
              setLogModalVisible(true);
              return;
            }
            const route = state.routes[routeIdx];
            if (!route) return;
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          if (tab.isFab) {
            // Raised, ceremonial center Log action (web: -mt-8 rounded-full
            // border-4 border-base-content).
            return (
              <View key="log-fab" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Pressable
                  onPress={onPress}
                  style={({ pressed }) => ({
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: COLORS.neutral,
                    backgroundColor: COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    marginTop: -28,
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  })}
                >
                  {/* Rounded on the image itself: expo-image is a native view
                      that the container's overflow:hidden doesn't reliably
                      clip, which rendered the FAB as a square. */}
                  <Image
                    source={require("../../assets/icon.png")}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                  />
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
            >
              <Text style={{ fontSize: 20, opacity: isFocused ? 1 : 0.5 }}>
                {tab.icon}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Segment-Bold",
                  color: isFocused ? COLORS.primary : COLORS.neutral + "99",
                  marginTop: 2,
                  letterSpacing: 0.4,
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <LogModal
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
      />
    </>
  );
}

// Web header: brand lockup on a slim bar over a 3px ink rule.
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

const LockupTitle = () => (
  <Image
    source={require("../../assets/images/lockup.png")}
    style={{ width: 128, height: 32 }}
    contentFit="contain"
  />
);

export default function TabLayout() {
  useRulesOnboarding();
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{
        headerBackground: headerWithInkRule,
        headerTintColor: COLORS.neutral,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "Segment-Bold",
          letterSpacing: 1,
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ headerTitle: () => <LockupTitle /> }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ headerTitle: "LEADERBOARD" }}
      />
      <Tabs.Screen
        name="judge"
        options={{ headerTitle: "JUDGE" }}
      />
      <Tabs.Screen
        name="earn"
        options={{ headerTitle: "EARN" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ headerTitle: "PROFILE" }}
      />
    </Tabs>
  );
}

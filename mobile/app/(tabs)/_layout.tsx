import React, { useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
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

const TAB_CONFIG = [
  { name: "index", icon: "🌭", label: "Feed" },
  { name: "leaderboard", icon: "🏆", label: "Board" },
  { name: "_log", icon: "🌭", label: "Log", isFab: true },
  { name: "judge", icon: "⚖️", label: "Judge" },
  { name: "profile", icon: "👤", label: "You" },
];

function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [logModalVisible, setLogModalVisible] = useState(false);

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#FFF8EC",
          borderTopWidth: 1,
          borderTopColor: "#E8D5AE",
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
          paddingHorizontal: 8,
        }}
      >
        {TAB_CONFIG.map((tab, idx) => {
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
            return (
              <View key="log-fab" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Pressable
                  onPress={onPress}
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    marginBottom: 8,
                    shadowColor: COLORS.secondary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Image
                    source={require("../../assets/icon.png")}
                    style={{ width: 58, height: 58 }}
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
              <Text style={{ fontSize: 22, opacity: isFocused ? 1 : 0.45 }}>
                {tab.icon}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: isFocused ? COLORS.neutral : COLORS.neutral + "70",
                  marginTop: 2,
                  letterSpacing: 0.3,
                }}
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

export default function TabLayout() {
  useRulesOnboarding();
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.base100 },
        headerTintColor: COLORS.neutral,
        headerTitleStyle: {
          fontFamily: "Anton_400Regular",
          letterSpacing: 1.5,
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ headerTitle: "LOG A DOG" }}
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

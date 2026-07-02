import React, { useEffect, useState } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LogModal } from "~/components/LogModal";
import { COLORS } from "~/constants/colors";
import { LOG_FAB_PROTRUSION } from "~/constants/layout";
import { useRulesOnboarding } from "~/hooks/useRulesOnboarding";

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { tabBarLabel?: string } }>;
  navigation: { emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean }; navigate: (name: string) => void };
  style?: StyleProp<ViewStyle>;
}

// Mirrors the web BottomNav: Feed · Leaderboard · [raised Log button] · Judge · You
const LOG_FAB_SIZE = 64;
const LOG_FAB_BORDER = 4;
const LOG_FAB_INNER = LOG_FAB_SIZE - LOG_FAB_BORDER * 2;
const BAR_BORDER_TOP = 3;
const BAR_PADDING_TOP = 8;

const TAB_CONFIG = [
  { name: "index", icon: "🌭", label: "Feed" },
  { name: "leaderboard", icon: "🏆", label: "Leaderboard" },
  { name: "_log", icon: "🌭", label: "Log", isFab: true },
  { name: "judge", icon: "🧑‍⚖️", label: "Judge" },
  { name: "profile", icon: "👤", label: "You" },
];

// Tab icon that springs up slightly when its tab becomes active — a small
// "landed here" bounce instead of a flat opacity swap.
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = withSpring(focused ? 1 : 0, {
      damping: 12,
      stiffness: 260,
      reduceMotion: ReduceMotion.System,
    });
  }, [focused, active]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + active.value * 0.2 },
      { translateY: active.value * -2 },
    ],
  }));

  return (
    <Animated.Text
      style={[{ fontSize: 20, opacity: focused ? 1 : 0.5 }, iconStyle]}
    >
      {icon}
    </Animated.Text>
  );
}

function CustomTabBar({ state, navigation, style }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [logModalVisible, setLogModalVisible] = useState(false);
  // The Log FAB squashes on press and springs back with overshoot on release.
  const fabPressed = useSharedValue(0);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - fabPressed.value * 0.12 }],
  }));

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[style, { position: "absolute", left: 0, right: 0, bottom: 0 }]}
      >
        {/* Web BottomNav: border-t-[3px] border-base-content bg-base-100 */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: COLORS.base100,
            borderTopWidth: BAR_BORDER_TOP,
            borderTopColor: COLORS.neutral,
            paddingBottom: insets.bottom + 4,
            paddingTop: BAR_PADDING_TOP,
            paddingHorizontal: 8,
            minHeight: 64,
          }}
        >
          {TAB_CONFIG.map((tab) => {
            // The FAB renders in the overlay below; keep an empty cell so the
            // remaining tabs land in the same columns as the web grid.
            if (tab.isFab) {
              return <View key="log-fab" style={{ flex: 1 }} />;
            }

            const routeIdx = state.routes.findIndex((r) => r.name === tab.name);
            const isFocused = state.index === routeIdx;

            const onPress = () => {
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

            return (
              <Pressable
                key={tab.name}
                onPress={onPress}
                style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
              >
                <TabIcon icon={tab.icon} focused={isFocused} />
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

        {/* Raised, ceremonial center Log action — top quarter overlaps content. */}
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: -LOG_FAB_PROTRUSION,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => setLogModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Log a dog"
            onPressIn={() => {
              fabPressed.value = withTiming(1, {
                duration: 80,
                reduceMotion: ReduceMotion.System,
              });
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onPressOut={() => {
              fabPressed.value = withSpring(0, {
                damping: 9,
                stiffness: 300,
                reduceMotion: ReduceMotion.System,
              });
            }}
          >
            <Animated.View
              style={[
                {
                  width: LOG_FAB_SIZE,
                  height: LOG_FAB_SIZE,
                  borderRadius: LOG_FAB_SIZE / 2,
                  borderWidth: LOG_FAB_BORDER,
                  borderColor: COLORS.neutral,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: COLORS.base100,
                },
                fabStyle,
              ]}
            >
              {/* expo-image is a native view; parent overflow:hidden does not
                  reliably clip it, so round the image itself. */}
              <Image
                source={require("../../assets/hotdog-icon.png")}
                style={{
                  width: LOG_FAB_INNER,
                  height: LOG_FAB_INNER,
                  borderRadius: LOG_FAB_INNER / 2,
                }}
                contentFit="cover"
              />
            </Animated.View>
          </Pressable>
        </View>
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
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
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

import React, { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const CARDS = [
  {
    icon: "🌭",
    title: "EAT A DOG",
    body: "Eat a hotdog. Any hotdog. The grill is always hot.",
  },
  {
    icon: "📷",
    title: "LOG IT",
    body: "Snap a pic of you eating it and log it onchain. Tap the 🌭 button.",
  },
  {
    icon: "⚖️",
    title: "GET JUDGED",
    body: "Other players have 48 hours to rule your dog VALID or SUS.",
  },
  {
    icon: "🏆",
    title: "CLIMB THE BOARD",
    body: "Valid dogs count toward the leaderboard. Winner takes the pot.",
  },
];

export default function RulesScreen() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (idx: number) => {
    setActiveIdx(idx);
    scrollRef.current?.scrollTo({ x: width * idx, animated: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={["bottom"]}>
      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {CARDS.map((card, i) => (
          <View
            key={i}
            style={{ width }}
            className="items-center justify-center px-8"
          >
            <Text className="text-8xl mb-6">{card.icon}</Text>
            <Text className="font-display text-neutral text-4xl text-center tracking-wider mb-4">
              {card.title}
            </Text>
            <Text className="text-neutral/70 text-center text-lg leading-relaxed">
              {card.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View className="flex-row justify-center gap-2 py-4">
        {CARDS.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => goTo(i)}
            style={{
              width: activeIdx === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIdx === i ? "#F5C518" : "#E8D5AE",
            }}
          />
        ))}
      </View>

      {/* Navigation */}
      <View className="px-6 pb-8 gap-3">
        {activeIdx < CARDS.length - 1 ? (
          <Pressable
            onPress={() => goTo(activeIdx + 1)}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            <Text className="font-display text-neutral text-xl tracking-wider">
              NEXT →
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            <Text className="font-display text-neutral text-xl tracking-wider">
              START LOGGING 🌭
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

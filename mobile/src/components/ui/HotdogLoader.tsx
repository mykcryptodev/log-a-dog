import React, { useEffect } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface Props {
  /** Font size of the hotdog glyph. */
  size?: number;
  /** Optional caption under the hotdog (e.g. "Loading dogs…"). */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

// Branded loading indicator: a hotdog rocking side to side like it's rolling
// on the grill. Replaces the generic ActivityIndicator for the big loading
// states. Honors the OS reduce-motion setting via ReduceMotion.System.
export function HotdogLoader({ size = 40, label, style }: Props) {
  const rock = useSharedValue(0);

  useEffect(() => {
    rock.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(-1, {
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.System,
    );
    return () => cancelAnimation(rock);
  }, [rock]);

  const rockStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rock.value * 14}deg` },
      // Lift slightly at the extremes so it reads as a roll, not a metronome.
      { translateY: Math.abs(rock.value) * -2 },
    ],
  }));

  return (
    <View style={[{ alignItems: "center", gap: 8 }, style]}>
      <Animated.Text
        style={[{ fontSize: size, lineHeight: Math.round(size * 1.25) }, rockStyle]}
        accessibilityRole="progressbar"
        accessibilityLabel={label ?? "Loading"}
      >
        🌭
      </Animated.Text>
      {label ? (
        <Text className="text-neutral/60 text-sm font-medium">{label}</Text>
      ) : null}
    </View>
  );
}

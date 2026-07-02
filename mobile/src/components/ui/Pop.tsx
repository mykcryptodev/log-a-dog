import React, { useCallback } from "react";
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "~/constants/colors";

// Native counterpart of the web app's "Sticker Brutalism" utilities
// (globals.css): thick ink outlines + hard offset shadows with no blur.
// React Native can't render blur-free offset box-shadows cross-platform, so
// the shadow is a solid ink layer positioned behind the bordered content.
// The shadow layer is pinned with edge insets rather than width/height
// percentages: percentage sizes on absolute children of shrink-wrapped
// (auto-width) parents mis-resolve on the new architecture and can paint a
// full-screen ink band (seen behind centered buttons like "Buy $HOTDOG").

export const INK = COLORS.neutral;

interface PopSurfaceProps {
  children: React.ReactNode;
  /** Hard shadow offset in px (web pop-card = 6, sticker = 3, pop-btn = 4). */
  offset?: number;
  radius?: number;
  borderWidth?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Web `.pop-card`: 3px ink border + hard offset shadow on a solid block. */
export function PopCard({
  children,
  offset = 5,
  radius = 28,
  borderWidth = 3,
  backgroundColor = COLORS.base100,
  style,
  contentStyle,
}: PopSurfaceProps) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          backgroundColor: INK,
        }}
      />
      <View
        style={[
          {
            borderWidth,
            borderColor: INK,
            borderRadius: radius,
            backgroundColor,
            overflow: "hidden",
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** Web `.sticker`: bordered tag with a small hard shadow, usually rotated. */
export function PopSticker({
  children,
  offset = 3,
  radius = 10,
  borderWidth = 3,
  backgroundColor = COLORS.base100,
  rotate = 0,
  style,
  contentStyle,
}: PopSurfaceProps & { rotate?: number }) {
  return (
    <View
      style={[{ transform: [{ rotate: `${rotate}deg` }] }, style]}
      pointerEvents="none"
    >
      <View
        style={{
          position: "absolute",
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          backgroundColor: INK,
        }}
      />
      <View
        style={[
          {
            borderWidth,
            borderColor: INK,
            borderRadius: radius,
            backgroundColor,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

interface PopButtonProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  offset?: number;
  radius?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Web `.pop-btn`: blocky button whose hard shadow collapses while the element
 * shifts into it on press. The press-in is a quick snap; the release springs
 * back with a little overshoot so the button feels like it pops back out.
 */
export function PopButton({
  children,
  offset = 4,
  radius = 14,
  backgroundColor = COLORS.primary,
  style,
  contentStyle,
  disabled,
  onPressIn,
  onPressOut,
  ...pressableProps
}: PopButtonProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      pressed.value = withTiming(1, {
        duration: 70,
        reduceMotion: ReduceMotion.System,
      });
      onPressIn?.(e);
    },
    [pressed, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      pressed.value = withSpring(0, {
        damping: 14,
        stiffness: 320,
        reduceMotion: ReduceMotion.System,
      });
      onPressOut?.(e);
    },
    [pressed, onPressOut],
  );

  const shiftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressed.value * offset },
      { translateY: pressed.value * offset },
    ],
  }));

  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          backgroundColor: INK,
          opacity: disabled ? 0.35 : 1,
        }}
      />
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...pressableProps}
      >
        <Animated.View
          style={[
            {
              borderWidth: 3,
              borderColor: INK,
              borderRadius: radius,
              backgroundColor,
              opacity: disabled ? 0.55 : 1,
            },
            contentStyle,
            shiftStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    </View>
  );
}

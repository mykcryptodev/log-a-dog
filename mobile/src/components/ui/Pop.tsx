import React from "react";
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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
 * shifts into it on press.
 */
export function PopButton({
  children,
  offset = 4,
  radius = 14,
  backgroundColor = COLORS.primary,
  style,
  contentStyle,
  disabled,
  ...pressableProps
}: PopButtonProps) {
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
      <Pressable disabled={disabled} {...pressableProps}>
        {({ pressed }) => (
          <View
            style={[
              {
                borderWidth: 3,
                borderColor: INK,
                borderRadius: radius,
                backgroundColor,
                opacity: disabled ? 0.55 : 1,
                transform: pressed
                  ? [{ translateX: offset }, { translateY: offset }]
                  : [],
              },
              contentStyle,
            ]}
          >
            {children}
          </View>
        )}
      </Pressable>
    </View>
  );
}

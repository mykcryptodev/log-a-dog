import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { COLORS } from "~/constants/colors";

interface Props {
  isValid: boolean;
}

export function VerdictStamp({ isValid }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(isValid ? -15 : 12)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [isValid ? -15 : 12, isValid ? -15 : 12],
    outputRange: [
      `${isValid ? -15 : 12}deg`,
      `${isValid ? -15 : 12}deg`,
    ],
  });

  const borderColor = isValid ? COLORS.accent : COLORS.error;
  const textColor = isValid ? COLORS.accent : COLORS.error;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { rotate: `${isValid ? -12 : 10}deg` },
          ],
          borderWidth: 4,
          borderColor,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 20,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      >
        <Text
          style={{
            fontFamily: "Anton_400Regular",
            fontSize: 28,
            color: textColor,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {isValid ? "VALID" : "SUS"}
        </Text>
      </Animated.View>
    </View>
  );
}

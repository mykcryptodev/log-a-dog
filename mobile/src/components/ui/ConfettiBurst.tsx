import React, { useEffect, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const GLYPHS = ["🌭", "🎉", "✨", "🌭", "🎊", "🌭", "⭐️"];
const PARTICLE_COUNT = 14;
const DURATION_MS = 1400;

interface ParticleConfig {
  glyph: string;
  /** Horizontal start, as a fraction of screen width. */
  x: number;
  /** How far it falls, px. */
  fall: number;
  /** Sideways drift over the fall, px. */
  drift: number;
  /** Total spin, deg. */
  spin: number;
  /** Fraction of the timeline to wait before moving. */
  delay: number;
  size: number;
}

function makeParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    glyph: GLYPHS[i % GLYPHS.length]!,
    x: 0.08 + Math.random() * 0.84,
    fall: 260 + Math.random() * 220,
    drift: (Math.random() - 0.5) * 90,
    spin: (Math.random() - 0.5) * 540,
    delay: Math.random() * 0.25,
    size: 20 + Math.random() * 14,
  }));
}

function Particle({
  config,
  progress,
}: {
  config: ParticleConfig;
  progress: SharedValue<number>;
}) {
  const { width } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    // Each particle occupies its own window of the shared timeline so the
    // burst feels scattered rather than lock-stepped.
    const t = interpolate(
      progress.value,
      [config.delay, 1],
      [0, 1],
      "clamp",
    );
    return {
      opacity: interpolate(t, [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: config.x * width + t * config.drift },
        { translateY: -40 + t * config.fall },
        { rotate: `${t * config.spin}deg` },
      ],
    };
  });

  return (
    <Animated.Text
      style={[{ position: "absolute", fontSize: config.size }, style]}
    >
      {config.glyph}
    </Animated.Text>
  );
}

/**
 * One-shot emoji confetti (hotdogs included) that rains from the top of its
 * container. Mount it when the celebration happens; it plays once and calls
 * onDone. Skipped entirely when the OS asks for reduced motion.
 */
export function ConfettiBurst({ onDone }: { onDone?: () => void }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const particles = useMemo(makeParticles, []);

  useEffect(() => {
    if (reduced) {
      onDone?.();
      return;
    }
    progress.value = withTiming(1, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    const id = setTimeout(() => onDone?.(), DURATION_MS + 100);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
    >
      {particles.map((p, i) => (
        <Particle key={i} config={p} progress={progress} />
      ))}
    </View>
  );
}

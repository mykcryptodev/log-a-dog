import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { getAttestationCountdown } from "@shared/time";

interface Props {
  /** Log unix timestamp in seconds. */
  timestamp: string;
}

/**
 * Live countdown for a log's 48h voting window (mobile counterpart to the web
 * VotingCountdown), with an info sheet explaining how judging works.
 */
export function VotingCountdown({ timestamp }: Props) {
  const [cd, setCd] = useState(() => getAttestationCountdown(timestamp));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setCd(getAttestationCountdown(timestamp));
    }, 1000);
    return () => clearInterval(id);
  }, [timestamp]);

  if (cd.expired) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1"
      >
        <Text className="text-neutral/40 text-xs">⏱</Text>
        <Text className="font-mono text-xs text-neutral/50">{cd.label}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={() => setOpen(false)}
        >
          <View className="bg-base-100 rounded-3xl p-6 w-full max-w-md">
            <Text className="font-display text-neutral text-2xl mb-3 tracking-wide">
              Hotdog vs Not Hotdog
            </Text>
            <Text className="text-neutral/70 text-sm leading-relaxed mb-2">
              The countdown is how long you have to judge whether this hotdog is
              valid.
            </Text>
            <Text className="text-neutral/70 text-sm leading-relaxed mb-2">
              Users moderate each other by judging if a photo should count toward
              the contest — this prevents duplicates, fakes, and spam.
            </Text>
            <Text className="text-neutral/70 text-sm leading-relaxed mb-2">
              To keep judges honest, they stake $HOTDOG. If your verdict matches
              the majority, you earn a portion of the tokens staked by voters who
              judged incorrectly.
            </Text>
            <Text className="text-neutral/60 text-sm leading-relaxed mb-5">
              Once the timer ends, voting closes. If a submission got more yes
              votes than no votes, it counts toward the total.
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              className="bg-primary rounded-2xl py-3 items-center"
            >
              <Text className="font-bold text-neutral">Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

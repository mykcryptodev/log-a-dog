import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { trpc } from "~/utils/trpc";
import { CHAIN_ID } from "~/constants";

interface Props {
  logId: string;
  timestamp: string;
}

/**
 * Shows the AI moderator's verdict for a log (the mobile counterpart to the web
 * AiJudgement). The AI bot auto-attests based on what it sees in the image; this
 * surfaces that as a small badge with an explanatory sheet.
 */
export function AiJudgement({ logId, timestamp }: Props) {
  const [open, setOpen] = useState(false);
  const { data } = trpc.hotdog.getAiVerificationStatus.useQuery(
    { chainId: CHAIN_ID, logId, timestamp },
    { refetchOnMount: false, refetchOnWindowFocus: false, retry: 1 },
  );

  if (data !== "VERIFIED" && data !== "REJECTED") return null;
  const verified = data === "VERIFIED";

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={[
          "flex-row items-center gap-1 rounded-full px-2 py-1",
          verified ? "bg-accent/10" : "bg-secondary/10",
        ].join(" ")}
      >
        <Text className="text-xs">{verified ? "🛡️" : "⚠️"}</Text>
        <Text
          className={[
            "text-xs font-bold",
            verified ? "text-accent" : "text-secondary",
          ].join(" ")}
        >
          {verified ? "AI Verified" : "AI Refuted"}
        </Text>
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
              {verified ? "🛡️ AI Verified" : "⚠️ AI Refuted"}
            </Text>
            <Text className="text-neutral/70 text-sm leading-relaxed mb-3">
              {verified
                ? "Our AI bot found someone eating a hotdog in this photo and gave the submission one upvote."
                : "Our AI bot did not find anyone eating a hotdog in this photo and gave the submission one downvote."}
            </Text>
            <Text className="text-neutral/60 text-sm leading-relaxed mb-5">
              AI bots can be wrong — use your own judgement when upvoting or
              downvoting.
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

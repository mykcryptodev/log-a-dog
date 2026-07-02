import React, { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { HotdogImage } from "~/components/HotdogImage";
import { formatAbbreviatedFiat } from "@shared/format";
import type { ZoraCoinDetails } from "~/types";

interface Props {
  preview?: string | null;
  rawImageUri?: string | null;
  zoraCoin: ZoraCoinDetails;
  blurhash?: string;
}

export function ZoraStatsFlip({ preview, rawImageUri, zoraCoin, blurhash }: Props) {
  const [flipped, setFlipped] = useState(false);
  const { width } = useWindowDimensions();
  const height = Math.round(width * (5 / 4));

  return (
    <Pressable onPress={() => setFlipped((f) => !f)} style={{ width, height }}>
      {flipped ? (
        <View className="flex-1 bg-base-200 p-4 justify-center">
          <Text className="font-display text-neutral text-lg mb-3">
            {zoraCoin.name}
          </Text>
          {zoraCoin.marketCap && (
            <Text className="text-neutral text-sm mb-1">
              MCap: ${formatAbbreviatedFiat(parseFloat(zoraCoin.marketCap))}
            </Text>
          )}
          {zoraCoin.volume24h && (
            <Text className="text-neutral text-sm mb-1">
              24h Vol: ${formatAbbreviatedFiat(parseFloat(zoraCoin.volume24h))}
            </Text>
          )}
          {typeof zoraCoin.uniqueHolders === "number" && (
            <Text className="text-neutral text-sm mb-1">
              Holders: {zoraCoin.uniqueHolders}
            </Text>
          )}
          <Text className="text-neutral/50 text-xs mt-2">Tap to flip back</Text>
        </View>
      ) : (
        <HotdogImage
          preview={preview}
          rawImageUri={rawImageUri}
          blurhash={blurhash}
        />
      )}
      <View className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-1">
        <Text className="text-white text-xs">{flipped ? "📷" : "📊"}</Text>
      </View>
    </Pressable>
  );
}

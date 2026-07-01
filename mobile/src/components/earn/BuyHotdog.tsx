import React from "react";
import { Linking, Text, View } from "react-native";
import { HOTDOG_TOKEN } from "~/constants/addresses";
import { CHAIN_ID } from "~/constants";
import { PopButton, INK } from "~/components/ui/Pop";

export function BuyHotdog() {
  const tokenAddress = HOTDOG_TOKEN[CHAIN_ID]!;

  const openBuy = () => {
    // Thirdweb universal buy / Base swap deep link
    const url =
      CHAIN_ID === 8453
        ? `https://app.uniswap.org/swap?chain=base&outputCurrency=${tokenAddress}`
        : `https://app.uniswap.org/swap?chain=base-sepolia&outputCurrency=${tokenAddress}`;
    void Linking.openURL(url);
  };

  return (
    <View
      className="bg-base-100 rounded-3xl p-4 mb-4 items-center"
      style={{ borderWidth: 3, borderColor: INK }}
    >
      <Text className="text-neutral/70 text-sm mb-3 text-center">
        Need some $HOTDOG to stake and vote?
      </Text>
      <PopButton
        onPress={openBuy}
        radius={12}
        contentStyle={{ paddingVertical: 12, paddingHorizontal: 32 }}
      >
        <Text className="font-display text-neutral tracking-wide">Buy $HOTDOG</Text>
      </PopButton>
    </View>
  );
}

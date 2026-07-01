import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { HOTDOG_TOKEN } from "~/constants/addresses";
import { CHAIN_ID } from "~/constants";

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
    <View className="bg-base-200 rounded-2xl p-4 mb-4 items-center">
      <Text className="text-neutral/70 text-sm mb-3 text-center">
        Need some $HOTDOG to stake and vote?
      </Text>
      <Pressable onPress={openBuy} className="bg-primary rounded-xl py-3 px-8">
        <Text className="font-bold text-neutral">Buy $HOTDOG</Text>
      </Pressable>
    </View>
  );
}

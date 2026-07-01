import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useWallet } from "~/providers/WalletProvider";
import { formatAddress } from "@shared/format";
import { COLORS } from "~/constants/colors";

export function ConnectWalletPrompt() {
  const { hasSigner, isConnecting, connectExternalWallet, address } = useWallet();

  if (hasSigner) {
    return (
      <View className="bg-accent/10 rounded-xl px-3 py-2 mb-3">
        <Text className="text-accent text-xs font-bold">
          ✓ Wallet connected · {formatAddress(address)}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-base-200 rounded-2xl p-4 mb-4">
      <Text className="font-bold text-neutral mb-1">Connect a wallet</Text>
      <Text className="text-neutral/60 text-sm mb-3">
        Staking, buying, and claiming require a wallet that can sign transactions.
        Farcaster sign-in alone uses your custody address for voting via the server.
      </Text>
      <Pressable
        onPress={() => void connectExternalWallet()}
        disabled={isConnecting}
        className="bg-primary rounded-xl py-3 items-center"
      >
        {isConnecting ? (
          <ActivityIndicator color={COLORS.neutral} />
        ) : (
          <Text className="font-bold text-neutral">Connect Wallet</Text>
        )}
      </Pressable>
    </View>
  );
}

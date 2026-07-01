import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useWallet } from "~/providers/WalletProvider";
import { formatAddress } from "@shared/format";
import { COLORS } from "~/constants/colors";
import { PopButton } from "~/components/ui/Pop";

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
    <View
      className="bg-base-100 rounded-3xl p-4 mb-4"
      style={{ borderWidth: 3, borderColor: COLORS.neutral }}
    >
      <Text className="font-bold text-neutral mb-1">Connect a wallet</Text>
      <Text className="text-neutral/60 text-sm mb-3">
        Staking, buying, and claiming require a wallet that can sign transactions.
        Farcaster sign-in alone uses your custody address for voting via the server.
      </Text>
      <PopButton
        onPress={() => void connectExternalWallet()}
        disabled={isConnecting}
        radius={12}
        contentStyle={{ paddingVertical: 12, alignItems: "center" }}
      >
        {isConnecting ? (
          <ActivityIndicator color={COLORS.neutral} />
        ) : (
          <Text className="font-display text-neutral tracking-wide">Connect Wallet</Text>
        )}
      </PopButton>
    </View>
  );
}

import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from "react-native";
import { getContract, prepareContractCall } from "thirdweb";
import { useActiveWallet } from "~/providers/WalletProvider";
import { useAuth } from "~/providers/AuthProvider";
import { sendOnChainTx } from "~/hooks/useOnChainTx";
import { LOG_A_DOG } from "~/constants/addresses";
import { getActiveChain } from "~/constants/chains";
import { getThirdwebClient } from "~/utils/thirdweb";
import { CHAIN_ID } from "~/constants";

interface Props {
  logId: string;
  eater: string;
  onRevoked?: () => void;
}

export function RevokeButton({ logId, eater, onRevoked }: Props) {
  const { session } = useAuth();
  const wallet = useActiveWallet();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner =
    session?.address?.toLowerCase() === eater.toLowerCase() ||
    wallet?.getAccount()?.address?.toLowerCase() === eater.toLowerCase();

  if (!isOwner) return null;

  const revoke = async () => {
    if (!wallet) {
      Alert.alert("Wallet required", "Connect a wallet to revoke your log.");
      return;
    }
    setBusy(true);
    try {
      const tx = prepareContractCall({
        contract: getContract({
          address: LOG_A_DOG[CHAIN_ID]!,
          client: getThirdwebClient(),
          chain: getActiveChain(),
        }),
        method: "function revokeHotdogLog(uint256 logId)",
        params: [BigInt(logId)],
      });
      await sendOnChainTx(wallet, tx);
      Alert.alert("Revoked", "Your log has been revoked.");
      setVisible(false);
      onRevoked?.();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="bg-error/10 rounded-full px-3 py-1.5"
      >
        <Text className="text-error text-xs font-bold">Revoke</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View className="bg-base-100 rounded-2xl p-6 w-full max-w-sm">
            <Text className="font-bold text-neutral text-lg mb-2">Revoke log?</Text>
            <Text className="text-neutral/60 text-sm mb-4">
              This permanently removes your hotdog log from the contest.
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setVisible(false)}
                className="flex-1 bg-base-200 rounded-xl py-3 items-center"
              >
                <Text className="font-bold text-neutral">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void revoke()}
                disabled={busy}
                className="flex-1 bg-error rounded-xl py-3 items-center"
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">Revoke</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

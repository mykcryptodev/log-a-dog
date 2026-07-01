import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { toEther } from "thirdweb/utils";
import { useActiveWallet } from "~/providers/WalletProvider";
import { useAuth } from "~/providers/AuthProvider";
import { sendOnChainTx } from "~/hooks/useOnChainTx";
import { PROTOCOL_REWARDS } from "~/constants/addresses";
import { getActiveChain } from "~/constants/chains";
import { getThirdwebClient } from "~/utils/thirdweb";
import { CHAIN_ID } from "~/constants";
import { COLORS } from "~/constants/colors";
import { PopButton } from "~/components/ui/Pop";

export function ClaimProtocolRewardsPanel() {
  const wallet = useActiveWallet();
  const { session } = useAuth();
  const address = wallet?.getAccount()?.address ?? session?.address;
  const chain = getActiveChain();
  const client = getThirdwebClient();
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);

  const contract = useMemo(
    () =>
      getContract({
        address: PROTOCOL_REWARDS[CHAIN_ID]!,
        client,
        chain,
      }),
    [client, chain],
  );

  const refresh = useCallback(async () => {
    if (!address) return;
    try {
      const bal = await readContract({
        contract,
        method: "function balanceOf(address) view returns (uint256)",
        params: [address],
      });
      setBalance(bal as bigint);
    } catch {
      // ignore
    }
  }, [address, contract]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const claim = async () => {
    if (!wallet || !address || balance === 0n) return;
    setBusy(true);
    try {
      const tx = prepareContractCall({
        contract,
        method: "function withdraw(address to, uint256 amount)",
        params: [address, balance],
      });
      await sendOnChainTx(wallet, tx);
      Alert.alert("Success", "Creator rewards claimed!");
      await refresh();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      className="bg-base-100 rounded-3xl p-4 mb-4"
      style={{ borderWidth: 3, borderColor: COLORS.neutral }}
    >
      <Text className="font-display text-neutral text-lg mb-2">Creator Rewards</Text>
      <View className="flex-row justify-between mb-3">
        <Text className="text-neutral/70">Protocol rewards</Text>
        <Text className="font-mono text-neutral">{Number(toEther(balance)).toFixed(4)} ETH</Text>
      </View>
      <PopButton
        onPress={() => void claim()}
        disabled={!wallet || busy || balance === 0n}
        backgroundColor={COLORS.secondary}
        radius={12}
        contentStyle={{ paddingVertical: 12, alignItems: "center" }}
      >
        {busy ? <ActivityIndicator color="#1E1A17" /> : <Text className="font-display tracking-wide" style={{ color: COLORS.base100 }}>Claim ETH</Text>}
      </PopButton>
    </View>
  );
}

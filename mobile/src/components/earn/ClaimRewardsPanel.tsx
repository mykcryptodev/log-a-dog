import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { toEther } from "thirdweb/utils";
import { useActiveWallet } from "~/providers/WalletProvider";
import { useAuth } from "~/providers/AuthProvider";
import { sendOnChainTx } from "~/hooks/useOnChainTx";
import { STAKING, STAKING_V1 } from "~/constants/addresses";
import { getActiveChain } from "~/constants/chains";
import { getThirdwebClient } from "~/utils/thirdweb";
import { CHAIN_ID } from "~/constants";
import { COLORS } from "~/constants/colors";
import { PopButton } from "~/components/ui/Pop";

export function ClaimRewardsPanel() {
  const wallet = useActiveWallet();
  const { session } = useAuth();
  const address = wallet?.getAccount()?.address ?? session?.address;
  const chain = getActiveChain();
  const client = getThirdwebClient();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<bigint>(0n);
  const [legacyPending, setLegacyPending] = useState<bigint>(0n);

  const stakingAddress = STAKING[CHAIN_ID]!;
  const legacyAddress = STAKING_V1[CHAIN_ID]!;
  const hasLegacy = stakingAddress.toLowerCase() !== legacyAddress.toLowerCase();

  const stakingContract = useMemo(
    () => getContract({ address: stakingAddress, client, chain }),
    [stakingAddress, client, chain],
  );
  const legacyContract = useMemo(
    () => getContract({ address: legacyAddress, client, chain }),
    [legacyAddress, client, chain],
  );

  const refresh = useCallback(async () => {
    if (!address) return;
    try {
      const rewards = await readContract({
        contract: stakingContract,
        method: "function getPendingRewards(address user) view returns (uint256)",
        params: [address],
      });
      setPending(rewards as bigint);
      if (hasLegacy) {
        const legacy = await readContract({
          contract: legacyContract,
          method: "function getPendingRewards(address user) view returns (uint256)",
          params: [address],
        });
        setLegacyPending(legacy as bigint);
      }
    } catch {
      // ignore
    }
  }, [address, stakingContract, legacyContract, hasLegacy]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const claim = async (legacy = false) => {
    if (!wallet) return;
    setBusy(true);
    try {
      const contract = legacy ? legacyContract : stakingContract;
      const tx = prepareContractCall({
        contract,
        method: "function claimRewards()",
        params: [],
      });
      await sendOnChainTx(wallet, tx);
      Alert.alert("Success", "Rewards claimed!");
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
      <Text className="font-display text-neutral text-lg mb-2">Claim Rewards</Text>
      <View className="flex-row justify-between mb-3">
        <Text className="text-neutral/70">Current season</Text>
        <Text className="font-mono text-neutral">{Number(toEther(pending)).toFixed(4)} $HOTDOG</Text>
      </View>
      <PopButton
        onPress={() => void claim(false)}
        disabled={!wallet || busy || pending === 0n}
        radius={12}
        style={{ marginBottom: 8 }}
        contentStyle={{ paddingVertical: 12, alignItems: "center" }}
      >
        {busy ? <ActivityIndicator color="#1E1A17" /> : <Text className="font-display text-neutral tracking-wide">Claim</Text>}
      </PopButton>

      {hasLegacy && (
        <>
          <View className="flex-row justify-between mb-3">
            <Text className="text-neutral/70">Legacy season</Text>
            <Text className="font-mono text-neutral">{Number(toEther(legacyPending)).toFixed(4)} $HOTDOG</Text>
          </View>
          <PopButton
            onPress={() => void claim(true)}
            disabled={!wallet || busy || legacyPending === 0n}
            backgroundColor={COLORS.base200}
            radius={12}
            contentStyle={{ paddingVertical: 12, alignItems: "center" }}
          >
            <Text className="font-display text-neutral tracking-wide">Claim Legacy</Text>
          </PopButton>
        </>
      )}
    </View>
  );
}

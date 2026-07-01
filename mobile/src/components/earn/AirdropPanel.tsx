import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { PopButton } from "~/components/ui/Pop";
import { getContract } from "thirdweb";
import { isClaimed, claimERC20 } from "thirdweb/extensions/airdrop";
import { useActiveWallet } from "~/providers/WalletProvider";
import { useAuth } from "~/providers/AuthProvider";
import { sendOnChainTx } from "~/hooks/useOnChainTx";
import { AIRDROP, HOTDOG_TOKEN } from "~/constants/addresses";
import { getActiveChain } from "~/constants/chains";
import { getThirdwebClient } from "~/utils/thirdweb";
import { CHAIN_ID } from "~/constants";
import { isAddressEligible, getAmountForAddress } from "@shared/merkle";
import { AIRDROP_CSV_DATA } from "~/data/airdrop";

export function AirdropPanel() {
  const csvData = AIRDROP_CSV_DATA;
  const wallet = useActiveWallet();
  const { session } = useAuth();
  const address = wallet?.getAccount()?.address ?? session?.address;
  const chain = getActiveChain();
  const client = getThirdwebClient();
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [amount, setAmount] = useState(0);

  const airdropContract = useMemo(
    () =>
      getContract({
        address: AIRDROP[CHAIN_ID]!,
        client,
        chain,
      }),
    [client, chain],
  );

  const checkState = useCallback(async () => {
    if (!address || !csvData.trim()) return;
    const eligible = isAddressEligible(csvData, address);
    setAmount(eligible ? getAmountForAddress(csvData, address) : 0);
    try {
      const hasClaimed = await isClaimed({
        contract: airdropContract,
        receiver: address as `0x${string}`,
        token: HOTDOG_TOKEN[CHAIN_ID]! as `0x${string}`,
        tokenId: 0n,
      });
      setClaimed(hasClaimed);
    } catch {
      // ignore
    }
  }, [address, csvData, airdropContract]);

  useEffect(() => {
    void checkState();
  }, [checkState]);

  const claim = async () => {
    if (!wallet || !address || amount <= 0) return;
    setBusy(true);
    try {
      const tx = claimERC20({
        contract: airdropContract,
        recipient: address as `0x${string}`,
        tokenAddress: HOTDOG_TOKEN[CHAIN_ID]! as `0x${string}`,
      });
      await sendOnChainTx(wallet, tx);
      Alert.alert("Success", "Airdrop claimed!");
      await checkState();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  if (!address) return null;

  return (
    <View
      className="bg-base-100 rounded-3xl p-4 mb-4"
      style={{ borderWidth: 3, borderColor: "#1E1A17" }}
    >
      <Text className="font-display text-neutral text-lg mb-2">Airdrop</Text>
      {amount > 0 ? (
        <Text className="text-neutral/70 mb-3">
          You are eligible for {amount.toLocaleString()} $HOTDOG
        </Text>
      ) : (
        <Text className="text-neutral/70 mb-3">
          Not eligible for the current airdrop.
        </Text>
      )}
      <PopButton
        onPress={() => void claim()}
        disabled={!wallet || busy || claimed || amount <= 0}
        radius={12}
        contentStyle={{ paddingVertical: 12, alignItems: "center" }}
      >
        {busy ? (
          <ActivityIndicator color="#1E1A17" />
        ) : (
          <Text className="font-display text-neutral tracking-wide">
            {claimed ? "Already Claimed" : "Claim Airdrop"}
          </Text>
        )}
      </PopButton>
    </View>
  );
}

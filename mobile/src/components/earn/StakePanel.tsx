import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { toEther, toWei } from "thirdweb/utils";
import { useActiveWallet } from "~/providers/WalletProvider";
import { useAuth } from "~/providers/AuthProvider";
import { sendOnChainTx } from "~/hooks/useOnChainTx";
import { HOTDOG_TOKEN, STAKING, STAKING_V1 } from "~/constants/addresses";
import { getActiveChain } from "~/constants/chains";
import { getThirdwebClient } from "~/utils/thirdweb";
import { CHAIN_ID } from "~/constants";
import { trpc } from "~/utils/trpc";
import { COLORS } from "~/constants/colors";
import { PopButton } from "~/components/ui/Pop";

export function StakePanel() {
  const wallet = useActiveWallet();
  const { session } = useAuth();
  const address = wallet?.getAccount()?.address ?? session?.address;
  const chain = getActiveChain();
  const client = getThirdwebClient();

  const [tab, setTab] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const stakingAddress = STAKING[CHAIN_ID]!;
  const tokenAddress = HOTDOG_TOKEN[CHAIN_ID]!;

  const stakingContract = useMemo(
    () => getContract({ address: stakingAddress, client, chain }),
    [stakingAddress, client, chain],
  );
  const tokenContract = useMemo(
    () => getContract({ address: tokenAddress, client, chain }),
    [tokenAddress, client, chain],
  );

  const { data: apy } = trpc.staking.getApy.useQuery(
    { chainId: CHAIN_ID },
    { staleTime: 60_000 },
  );

  const [balance, setBalance] = useState<bigint | null>(null);
  const [staked, setStaked] = useState<bigint | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!address) return;
    try {
      const [bal, stk] = await Promise.all([
        readContract({
          contract: tokenContract,
          method: "function balanceOf(address) view returns (uint256)",
          params: [address],
        }),
        readContract({
          contract: stakingContract,
          method: "function stakes(address user) view returns (uint256)",
          params: [address],
        }),
      ]);
      setBalance(bal as bigint);
      setStaked(stk as bigint);
    } catch {
      // ignore
    }
  }, [address, tokenContract, stakingContract]);

  React.useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  const handleStake = async () => {
    if (!wallet || !amount) return;
    setBusy(true);
    try {
      const wei = toWei(amount);
      const currentAllowance = await allowance({
        contract: tokenContract,
        owner: address!,
        spender: stakingAddress,
      });
      if (currentAllowance < wei) {
        const approveTx = approve({
          contract: tokenContract,
          spender: stakingAddress,
          amount: wei.toString(),
        });
        await sendOnChainTx(wallet, approveTx);
      }
      const stakeTx = prepareContractCall({
        contract: stakingContract,
        method: "function stake(uint256 amount)",
        params: [wei],
      });
      await sendOnChainTx(wallet, stakeTx);
      Alert.alert("Success", "Staked successfully!");
      setAmount("");
      await refreshBalances();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Stake failed");
    } finally {
      setBusy(false);
    }
  };

  const handleUnstake = async () => {
    if (!wallet || !amount) return;
    setBusy(true);
    try {
      const wei = toWei(amount);
      const unstakeTx = prepareContractCall({
        contract: stakingContract,
        method: "function unstake(uint256 amount)",
        params: [wei],
      });
      await sendOnChainTx(wallet, unstakeTx);
      Alert.alert("Success", "Unstaked successfully!");
      setAmount("");
      await refreshBalances();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Unstake failed");
    } finally {
      setBusy(false);
    }
  };

  const balanceLabel = balance != null ? Number(toEther(balance)).toFixed(0) : "—";
  const stakedLabel = staked != null ? Number(toEther(staked)).toFixed(0) : "—";

  return (
    <View
      className="bg-base-100 rounded-3xl p-4 mb-4"
      style={{ borderWidth: 3, borderColor: COLORS.neutral }}
    >
      <Text className="font-display text-neutral text-lg mb-1">Stake $HOTDOG</Text>
      <Text className="text-neutral/60 text-sm mb-3">
        APY: {typeof apy === "number" ? `${apy.toFixed(1)}%` : "—"} · Balance: {balanceLabel} · Staked: {stakedLabel}
      </Text>

      <View className="flex-row gap-2 mb-3">
        {(["stake", "unstake"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 items-center ${tab === t ? "bg-primary" : "bg-base-200"}`}
            style={{ borderWidth: 2, borderColor: COLORS.neutral }}
          >
            <Text className={`font-bold text-sm capitalize ${tab === t ? "text-neutral" : "text-neutral/60"}`}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount"
        keyboardType="decimal-pad"
        className="bg-base-200 rounded-xl px-4 py-3 text-neutral mb-3"
        placeholderTextColor="#999"
      />

      <PopButton
        onPress={() => void (tab === "stake" ? handleStake() : handleUnstake())}
        disabled={!wallet || busy || !amount}
        backgroundColor={COLORS.accent}
        radius={12}
        contentStyle={{ paddingVertical: 12, alignItems: "center" }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-display text-white capitalize tracking-wide">{tab}</Text>
        )}
      </PopButton>
    </View>
  );
}

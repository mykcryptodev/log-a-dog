import { type FC, useState, useEffect, useMemo } from "react";
import {
  TransactionButton,
  useActiveWallet,
  useWalletBalance,
  useReadContract,
  useActiveAccount,
} from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { DEFAULT_CHAIN } from "~/constants";
import { HOTDOG_TOKEN, STAKING } from "~/constants/addresses";
import {
  stake,
  unstake,
} from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";
import { getContract } from "thirdweb";
import { toast } from "react-toastify";
import { MINIMUM_STAKE } from "~/constants";
import { parseEther, formatEther, InsufficientFundsError } from "viem";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { Buy } from "~/components/utils/Buy";
import { api } from "~/utils/api";
import Connect from "~/components/utils/Connect";

type Props = {
  onStake?: (amount: string) => void;
  hideTitle?: boolean;
};

export const Stake: FC<Props> = ({ onStake, hideTitle = false }) => {
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState<string>("");
  const [percentage, setPercentage] = useState<number>(0);
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");
  const [unstakePercentage, setUnstakePercentage] = useState<number>(0);
  const [hasApproval, setHasApproval] = useState(false);
  const activeChain = DEFAULT_CHAIN;
  const wallet = useActiveWallet();
  const account = useActiveAccount();

  const { data: balance, isLoading: isLoadingBalance, refetch } = useWalletBalance({
    client,
    address: account?.address,
    chain: activeChain,
    tokenAddress: HOTDOG_TOKEN[activeChain.id],
  });

  useEffect(() => {
    if (account?.address) {
      void refetch();
    }
  }, [account?.address, refetch]);

  const { data: stakedAmount, isLoading: isLoadingStaked } = useReadContract({
    contract: getContract({
      address: STAKING[activeChain.id]!,
      client,
      chain: activeChain,
    }),
    method: "function stakes(address user) view returns (uint256)",
    params: [account?.address ?? "0x0"],
    queryOptions: {
      enabled: !!account?.address,
    },
  });

  const { data: apy, isLoading: isLoadingApy } = api.staking.getApy.useQuery(
    { chainId: activeChain.id },
    { staleTime: 30_000 }
  );

  useEffect(() => {
    const checkAllowance = async () => {
      if (!wallet || !amount) return;

      const tokenContract = getContract({
        address: HOTDOG_TOKEN[activeChain.id]!,
        client,
        chain: activeChain,
      });

      const allowanceAmt = await allowance({
        contract: tokenContract,
        owner: wallet.getAccount()!.address,
        spender: STAKING[activeChain.id]!,
      });

      setHasApproval(allowanceAmt >= parseEther(amount));
    };

    void checkAllowance();
  }, [wallet, amount, activeChain]);

  useEffect(() => {
    if (!balance?.displayValue) return;
    const newAmount = Number(balance.displayValue) * (percentage / 100);
    setAmount(newAmount.toString());
  }, [percentage, balance]);

  useEffect(() => {
    if (!stakedAmount) return;
    const stakedDisplayValue = Number(formatEther(stakedAmount));
    const newUnstakeAmount = stakedDisplayValue * (unstakePercentage / 100);
    setUnstakeAmount(newUnstakeAmount.toString());
  }, [unstakePercentage, stakedAmount]);

  const balanceIsInsufficient = useMemo(() => {
    return BigInt(balance?.value ?? 0) < BigInt(MINIMUM_STAKE);
  }, [balance]);

  const amountExceedsBalance = useMemo(() => {
    if (!amount || !balance?.value) return false;
    try {
      const amountInWei = parseEther(amount);
      return amountInWei > BigInt(balance.value);
    } catch {
      // If parsing fails, fall back to displayValue comparison
      const bal = Number(balance?.displayValue ?? 0);
      return Number(amount) > bal;
    }
  }, [amount, balance]);

  const amountBelowMinimum = useMemo(() => {
    if (!amount) return false;
    try {
      const amountInWei = parseEther(amount);
      return amountInWei < BigInt(MINIMUM_STAKE);
    } catch {
      return Number(amount) < 100; // Fallback to 100 tokens
    }
  }, [amount]);

  const unstakeAmountExceedsStaked = useMemo(() => {
    if (!unstakeAmount || !stakedAmount) return false;
    try {
      const unstakeAmountInWei = parseEther(unstakeAmount);
      return unstakeAmountInWei > stakedAmount;
    } catch {
      const stakedDisplayValue = Number(formatEther(stakedAmount ?? 0n));
      return Number(unstakeAmount) > stakedDisplayValue;
    }
  }, [unstakeAmount, stakedAmount]);

  const invalidAmount = Number(amount) <= 0;
  const invalidUnstakeAmount = Number(unstakeAmount) <= 0;
  const showInsufficientBalance = balanceIsInsufficient && !invalidAmount;
  const hasStakedTokens = stakedAmount !== undefined && Number(formatEther(stakedAmount)) > 0;

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = Number(e.target.value);
    if (isNaN(newPercentage)) return;
    setPercentage(newPercentage);
  };

  const handleUnstakePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = Number(e.target.value);
    if (isNaN(newPercentage)) return;
    setUnstakePercentage(newPercentage);
  };

  const isDisabled = showInsufficientBalance || amountExceedsBalance || amountBelowMinimum || invalidAmount;
  const isUnstakeDisabled = !hasStakedTokens || unstakeAmountExceedsStaked || invalidUnstakeAmount;

  return (
    <div>
      {!hideTitle && <h1 className="mb-4 text-2xl font-bold">Stake $HOTDOG</h1>}
      
      {/* Tabs */}
      <div className="tabs tabs-boxed mb-4 w-full">
        <button
          className={`tab tab-lg flex-1 ${activeTab === "stake" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("stake")}
        >
          Stake
        </button>
        <button
          className={`tab tab-lg flex-1 ${activeTab === "unstake" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("unstake")}
          disabled={!hasStakedTokens}
        >
          Unstake
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "stake" ? (
          <>
            {/* Stake Tab Content */}
            <div className="stats stats-vertical w-full max-w-full shadow md:stats-horizontal">
              <div className="stat text-center">
                <div className="stat-title">Amount to Stake</div>
                <input
                  type="number"
                  className="stat-value w-full max-w-[12ch] bg-transparent text-center text-primary focus:outline-none"
                  value={amount}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value === "") {
                      setAmount("");
                      return;
                    }
                    value = value.replace(/^0+(?=\d)/, "");
                    setAmount(value);
                  }}
                />
                <div className="stat-desc flex items-center justify-between">
                  <div>
                    {isLoadingStaked
                      ? "Loading staked..."
                      : `Staked: ${Number(formatEther(stakedAmount ?? 0n)).toLocaleString()}`}
                  </div>
                  <div>
                    {isLoadingBalance
                      ? "Loading balance..."
                      : `Balance: ${Number(balance?.displayValue ?? 0).toLocaleString()}`}
                  </div>
                </div>
                <div className="text-center text-xs mt-2 opacity-60">
                  Current APY:
                  {isLoadingApy ? " Loading..." : ` ${apy?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "0"}%`}
                </div>
              </div>
            </div>
            
            {amountExceedsBalance && (
              <div className="text-center text-sm text-error">
                Amount exceeds balance
              </div>
            )}
            {amountBelowMinimum && Number(amount) > 0 && (
              <div className="text-center text-sm text-warning">
                Minimum stake is 300,000 $HOTDOG tokens
              </div>
            )}

            <div>
              <label
                htmlFor="percentage"
                className="mb-1 block text-sm font-medium"
              >
                Percentage of Balance: {percentage}%
              </label>
              <input
                id="percentage"
                type="range"
                min="0"
                max="100"
                value={percentage}
                onChange={handlePercentageChange}
                className="range"
                step="1"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => setPercentage(0)}
                >
                  0%
                </button>
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => setPercentage(25)}
                >
                  25%
                </button>
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => setPercentage(50)}
                >
                  50%
                </button>
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => setPercentage(75)}
                >
                  75%
                </button>
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => setPercentage(100)}
                >
                  100%
                </button>
              </div>
            </div>

            {!wallet ? (
              <div className="text-center">
                <p className="mb-4 text-sm opacity-75">Connect your wallet to stake tokens</p>
                <Connect loginBtnLabel="Connect Wallet to Stake" />
              </div>
            ) : hasApproval ? (
              <TransactionButton
                className="!btn !btn-primary !btn-block"
                transaction={() =>
                  stake({
                    contract: getContract({
                      address: STAKING[activeChain.id]!,
                      client,
                      chain: activeChain,
                    }),
                    amount: parseEther(amount),
                  })
                }
                onTransactionSent={() => toast.loading("Staking...")}
                onTransactionConfirmed={() => {
                  toast.dismiss();
                  toast.success("Staked!");
                  onStake?.(amount);
                }}
                onError={(err) => {
                  toast.dismiss();
                  // Format large numbers in error messages to be human-readable
                  const formattedMessage = err.message.replace(/\b\d{19,}\b/g, (match) => {
                    try {
                      const tokenAmount = Number(formatEther(BigInt(match)));
                      return `${tokenAmount.toLocaleString()} tokens`;
                    } catch {
                      return match;
                    }
                  });
                  toast.error(`Staking failed: ${formattedMessage}`);
                }}
                disabled={isDisabled}
              >
                {showInsufficientBalance
                  ? "Insufficient balance (need 100+ tokens)"
                  : amountExceedsBalance
                    ? "Amount exceeds balance"
                    : amountBelowMinimum
                      ? "Minimum stake is 100 tokens"
                      : "Stake"}
              </TransactionButton>
            ) : (
              <TransactionButton
                className="!btn !btn-primary !btn-block"
                transaction={() =>
                  approve({
                    contract: getContract({
                      address: HOTDOG_TOKEN[activeChain.id]!,
                      client,
                      chain: activeChain,
                    }),
                    amount,
                    spender: STAKING[activeChain.id]!,
                  })
                }
                onTransactionSent={() => toast.loading("Approving...")}
                onTransactionConfirmed={() => {
                  toast.dismiss();
                  toast.success("Approved!");
                  setHasApproval(true);
                }}
                onError={(err) => {
                  toast.dismiss();
                  // Format large numbers in error messages to be human-readable
                  const formattedMessage = err.message.replace(/\b\d{19,}\b/g, (match) => {
                    try {
                      const tokenAmount = Number(formatEther(BigInt(match)));
                      return `${tokenAmount.toLocaleString()} tokens`;
                    } catch {
                      return match;
                    }
                  });
                  toast.error(`Approval failed: ${formattedMessage}`);
                }}
                disabled={isDisabled}
              >
                {showInsufficientBalance
                  ? "Insufficient balance (need 100+ tokens)"
                  : amountExceedsBalance
                    ? "Amount exceeds balance"
                    : amountBelowMinimum
                      ? "Minimum stake is 100 tokens"
                      : "Approve"}
              </TransactionButton>
            )}

            {InsufficientFundsError && (
              <div className="flex flex-col gap-2">
                <p className="text-center">Need some $HOTDOG?</p>
                <Buy />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Unstake Tab Content */}
            <div className="stats stats-vertical w-full max-w-full shadow md:stats-horizontal">
              <div className="stat text-center">
                <div className="stat-title">Amount to Unstake</div>
                <input
                  type="number"
                  className="stat-value w-full max-w-[12ch] bg-transparent text-center text-secondary focus:outline-none"
                  value={unstakeAmount}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value === "") {
                      setUnstakeAmount("");
                      return;
                    }
                    value = value.replace(/^0+(?=\d)/, "");
                    setUnstakeAmount(value);
                  }}
                />
                <div className="stat-desc">
                  Max: {Number(formatEther(stakedAmount ?? 0n)).toLocaleString()}
                </div>
              </div>
            </div>
            
            {unstakeAmountExceedsStaked && (
              <div className="text-center text-sm text-error">
                Amount exceeds staked balance
              </div>
            )}

            <div>
              <label
                htmlFor="unstakePercentage"
                className="mb-1 block text-sm font-medium"
              >
                Percentage of Staked: {unstakePercentage}%
              </label>
              <input
                id="unstakePercentage"
                type="range"
                min="0"
                max="100"
                value={unstakePercentage}
                onChange={handleUnstakePercentageChange}
                className="range range-secondary"
                step="1"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                <button
                  type="button"
                  className="hover:text-secondary"
                  onClick={() => setUnstakePercentage(0)}
                >
                  0%
                </button>
                <button
                  type="button"
                  className="hover:text-secondary"
                  onClick={() => setUnstakePercentage(25)}
                >
                  25%
                </button>
                <button
                  type="button"
                  className="hover:text-secondary"
                  onClick={() => setUnstakePercentage(50)}
                >
                  50%
                </button>
                <button
                  type="button"
                  className="hover:text-secondary"
                  onClick={() => setUnstakePercentage(75)}
                >
                  75%
                </button>
                <button
                  type="button"
                  className="hover:text-secondary"
                  onClick={() => setUnstakePercentage(100)}
                >
                  100%
                </button>
              </div>
            </div>

            <TransactionButton
              className="!btn !btn-secondary !btn-block"
              transaction={() =>
                unstake({
                  contract: getContract({
                    address: STAKING[activeChain.id]!,
                    client,
                    chain: activeChain,
                  }),
                  amount: parseEther(unstakeAmount),
                })
              }
              onTransactionSent={() => toast.loading("Unstaking...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Unstaked!");
                onStake?.(unstakeAmount);
              }}
              onError={(err) => {
                toast.dismiss();
                // Format large numbers in error messages to be human-readable
                const formattedMessage = err.message.replace(/\b\d{19,}\b/g, (match) => {
                  try {
                    const tokenAmount = Number(formatEther(BigInt(match)));
                    return `${tokenAmount.toLocaleString()} tokens`;
                  } catch {
                    return match;
                  }
                });
                toast.error(`Unstaking failed: ${formattedMessage}`);
              }}
              disabled={isUnstakeDisabled}
            >
              {!hasStakedTokens
                ? "No tokens staked"
                : unstakeAmountExceedsStaked
                  ? "Amount exceeds staked balance"
                  : invalidUnstakeAmount
                    ? "Enter amount to unstake"
                    : "Unstake"}
            </TransactionButton>
          </>
        )}
      </div>
    </div>
  );
};

import { type FC, useState, useEffect, useMemo } from "react";
import {
  TransactionButton,
  useActiveWallet,
  useWalletBalance,
  useReadContract,
} from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import useActiveChain from "~/hooks/useActiveChain";
import { HOTDOG_TOKEN, STAKING } from "~/constants/addresses";
import { useSession } from "next-auth/react";
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

type Props = {
  onStake?: (amount: string) => void;
  hideTitle?: boolean;
};

export const Stake: FC<Props> = ({ onStake, hideTitle = false }) => {
  const [amount, setAmount] = useState<string>("");
  const [percentage, setPercentage] = useState<number>(0);
  const [hasApproval, setHasApproval] = useState(false);
  const { activeChain } = useActiveChain();
  const wallet = useActiveWallet();
  const { data: sessionData } = useSession();

  const { data: balance, isLoading: isLoadingBalance } = useWalletBalance({
    client,
    address: sessionData?.user.address,
    chain: activeChain,
    tokenAddress: HOTDOG_TOKEN[activeChain.id],
  });

  const { data: stakedAmount, isLoading: isLoadingStaked } = useReadContract({
    contract: getContract({
      address: STAKING[activeChain.id]!,
      client,
      chain: activeChain,
    }),
    method: "function stakes(address user) view returns (uint256)",
    params: [sessionData?.user.address ?? "0x0"],
    queryOptions: {
      enabled: !!sessionData?.user.address,
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

  const balanceIsInsufficient = useMemo(() => {
    return BigInt(balance?.value ?? 0) < BigInt(MINIMUM_STAKE);
  }, [balance]);

  const amountExceedsBalance = useMemo(() => {
    const bal = Number(balance?.displayValue ?? 0);
    if (!amount) return false;
    return Number(amount) > bal;
  }, [amount, balance]);

  const invalidAmount = Number(amount) <= 0;
  const showInsufficientBalance = balanceIsInsufficient && !invalidAmount;

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = Number(e.target.value);
    if (isNaN(newPercentage)) return;
    setPercentage(newPercentage);
  };

  return (
    <div>
      {!hideTitle && <h1 className="mb-4 text-2xl font-bold">Stake $HOTDOG</h1>}
      <div className="space-y-4">
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

        {hasApproval ? (
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
              toast.error(`Staking failed: ${err.message}`);
            }}
            disabled={
              showInsufficientBalance || amountExceedsBalance || invalidAmount
            }
          >
            {showInsufficientBalance
              ? "Insufficient balance"
              : amountExceedsBalance
                ? "Amount too high"
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
                amount: parseEther(amount).toString(),
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
              toast.error(`Approval failed: ${err.message}`);
            }}
            disabled={
              showInsufficientBalance || amountExceedsBalance || invalidAmount
            }
          >
            {showInsufficientBalance
              ? "Insufficient balance"
              : amountExceedsBalance
                ? "Amount too high"
                : "Approve"}
          </TransactionButton>
        )}
        {stakedAmount !== undefined &&
          Number(formatEther(stakedAmount)) > 0 && (
            <TransactionButton
              className="!btn !btn-block !mt-2"
              transaction={() =>
                unstake({
                  contract: getContract({
                    address: STAKING[activeChain.id]!,
                    client,
                    chain: activeChain,
                  }),
                  amount: stakedAmount,
                })
              }
              onTransactionSent={() => toast.loading("Unstaking...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Unstaked!");
                onStake?.(amount);
              }}
              onError={(err) => {
                toast.dismiss();
                toast.error(`Unstaking failed: ${err.message}`);
              }}
            >
              Unstake all
            </TransactionButton>
          )}
        {InsufficientFundsError && (
          <div className="flex flex-col gap-2">
            <p className="text-center">Need some $HOTDOG?</p>
            <Buy />
          </div>
        )}
      </div>
    </div>
  );
};

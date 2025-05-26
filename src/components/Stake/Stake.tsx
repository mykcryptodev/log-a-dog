import { type FC, useState, useEffect, useMemo } from "react";
import { TransactionButton, useActiveWallet, useSendTransaction, useWalletBalance } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import useActiveChain from "~/hooks/useActiveChain";
import { HOTDOG_TOKEN, STAKING } from "~/constants/addresses";
import { useSession } from "next-auth/react";
import { stake } from "~/thirdweb/84532/0xe6b5534390596422d0e882453deed2afc74dae25";
import { getContract } from "thirdweb";
import { toast } from "react-toastify";
import { MINIMUM_STAKE } from "~/constants";
import { parseEther } from "viem";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { env } from "~/env";
 
type Props = {
  onStake?: (amount: string) => void;
  hideTitle?: boolean;
}

export const Stake: FC<Props> = ({ onStake, hideTitle = false }) => {
  const [amount, setAmount] = useState<string>("");
  const [percentage, setPercentage] = useState<number>(0);
  const [hasApproval, setHasApproval] = useState(false);
  const { activeChain } = useActiveChain();
  const wallet = useActiveWallet();
  const { data: sessionData } = useSession();
  const { mutate: sendTransaction } = useSendTransaction({
    payModal: {
      supportedTokens: {
        [activeChain.id]: [
          {
            address: HOTDOG_TOKEN[activeChain.id]!,
            name: "Hotdog",
            symbol: "HOTDOG",
            icon: "images/hotdog.png",
          },
        ],
      },
    },
  });
  
  const { data: balance, isLoading: isLoadingBalance } = useWalletBalance({
    client,
    address: sessionData?.user.address,
    chain: activeChain,
    tokenAddress: HOTDOG_TOKEN[activeChain.id],
  });

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

      setHasApproval(BigInt(allowanceAmt) >= parseEther(amount));
    };

    void checkAllowance();
  }, [wallet, amount, activeChain]);

  useEffect(() => {
    if (!balance?.displayValue) return;
    const newAmount = (Number(balance.displayValue) * (percentage / 100));
    setAmount(newAmount.toString());
  }, [percentage, balance]);

  const balanceIsInsufficient = useMemo(() => {
    return Number(balance?.value ?? 0) < MINIMUM_STAKE;
  }, [balance]);

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = Number(e.target.value);
    if (isNaN(newPercentage)) return;
    setPercentage(newPercentage);
  };

  return (
    <div>
      {!hideTitle && <h1 className="text-2xl font-bold mb-4">Stake $HOTDOG</h1>}
      <div className="space-y-4">
        <div className="stats shadow w-full">
          <div className="stat text-center">
            <div className="stat-title">Amount to Stake</div>
            <div className="stat-value text-primary">{Number(amount).toLocaleString()}</div>
            <div className="stat-desc">
              {isLoadingBalance ? "Loading balance..." : `Balance: ${Number(balance?.displayValue ?? 0).toLocaleString()}`}
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="percentage" className="block text-sm font-medium mb-1">
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
          <div className="w-full flex justify-between text-xs px-2">
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
            transaction={() => stake({
              contract: getContract({
                address: STAKING[activeChain.id]!,
                client,
                chain: activeChain,
              }),
              amount: parseEther(amount),
            })}
            onTransactionSent={() => toast.loading("Staking...")}
            onTransactionConfirmed={() => {
              toast.success("Staked!");
              onStake?.(amount);
            }}
            onError={(err) => {
              console.log({ err });
              toast.error(`Staking failed: ${err.message}`);
            }}
            disabled={balanceIsInsufficient}
          >
            {balanceIsInsufficient ? "Insufficient balance" : "Stake"}
          </TransactionButton>
        ) : (
          <TransactionButton
            className="!btn !btn-primary !btn-block"
            transaction={() => approve({
              contract: getContract({
                address: HOTDOG_TOKEN[activeChain.id]!,
                client,
                chain: activeChain,
              }),
              amount: parseEther(amount).toString(),
              spender: STAKING[activeChain.id]!,
            })}
            onTransactionSent={() => toast.loading("Approving...")}
            onTransactionConfirmed={() => {
              toast.dismiss();
              toast.success("Approved!");
              setHasApproval(true);
            }}
            onError={(err) => {
              toast.dismiss();
              console.log({ err });
              toast.error(`Approval failed: ${err.message}`);
            }}
            disabled={balanceIsInsufficient}
          >
            {balanceIsInsufficient ? "Insufficient balance" : "Approve"}
          </TransactionButton>
        )}
      </div>
    </div>
  );
};
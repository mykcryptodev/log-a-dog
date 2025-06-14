import { useState, type FC, useContext } from "react";
import { toast } from "react-toastify";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { viemAdapter } from "thirdweb/adapters/viem";
import { parseEther } from "viem";
import { buyCoin, sellCoin, getQuote } from "@zoralabs/coins-sdk";
import { base, baseSepolia } from "viem/chains";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";

type Props = {
  coinAddress: string;
  logId: string;
}

export const ZoraCoinTrading: FC<Props> = ({ coinAddress, logId }) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { activeChain } = useContext(ActiveChainContext);
  const [isLoading, setIsLoading] = useState(false);
  const [buyAmount, setBuyAmount] = useState("0.001");
  const [sellAmount, setSellAmount] = useState("1");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  const handleBuy = async () => {
    if (!account || !wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    try {
      // Convert thirdweb wallet to viem wallet client
      const viemWallet = viemAdapter.walletClient.toViem({
        client: wallet,
        chain: activeChain.id === base.id ? base : baseSepolia,
        account: account.address as `0x${string}`,
      });

      // Get quote for the buy
      const quote = await getQuote({
        chainId: activeChain.id,
        tokenAddress: coinAddress as `0x${string}`,
        amount: parseEther(buyAmount),
        type: "buy",
      });

      // Execute the buy
      const hash = await buyCoin({
        chainId: activeChain.id,
        tokenAddress: coinAddress as `0x${string}`,
        amount: parseEther(buyAmount),
        recipient: account.address as `0x${string}`,
        walletClient: viemWallet,
        slippagePercentage: 5, // 5% slippage
      });

      toast.success(`Buy successful! TX: ${hash}`);
      setShowBuyModal(false);
    } catch (error) {
      console.error("Buy error:", error);
      toast.error("Failed to buy coin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!account || !wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    try {
      // Convert thirdweb wallet to viem wallet client
      const viemWallet = viemAdapter.walletClient.toViem({
        client: wallet,
        chain: activeChain.id === base.id ? base : baseSepolia,
        account: account.address as `0x${string}`,
      });

      // Get quote for the sell
      const quote = await getQuote({
        chainId: activeChain.id,
        tokenAddress: coinAddress as `0x${string}`,
        amount: parseEther(sellAmount),
        type: "sell",
      });

      // Execute the sell
      const hash = await sellCoin({
        chainId: activeChain.id,
        tokenAddress: coinAddress as `0x${string}`,
        amount: parseEther(sellAmount),
        recipient: account.address as `0x${string}`,
        walletClient: viemWallet,
        slippagePercentage: 5, // 5% slippage
      });

      toast.success(`Sell successful! TX: ${hash}`);
      setShowSellModal(false);
    } catch (error) {
      console.error("Sell error:", error);
      toast.error("Failed to sell coin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs">{logId}</span>
      <button 
        className="btn btn-primary btn-xs"
        onClick={() => setShowBuyModal(true)}
      >
        Buy
      </button>
      <button 
        className="btn btn-secondary btn-xs"
        onClick={() => setShowSellModal(true)}
      >
        Sell
      </button>

      {/* Buy Modal */}
      <input type="checkbox" id={`buy-modal-${logId}`} className="modal-toggle" checked={showBuyModal} onChange={() => {}} />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Buy Zora Coin</h3>
          <div className="py-4">
            <label className="label">
              <span className="label-text">Amount (ETH)</span>
            </label>
            <input 
              type="number" 
              placeholder="0.001" 
              className="input input-bordered w-full" 
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              step="0.001"
              min="0"
            />
          </div>
          <div className="modal-action">
            <button 
              className="btn"
              onClick={() => setShowBuyModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              disabled={isLoading || !buyAmount || parseFloat(buyAmount) <= 0}
              onClick={handleBuy}
            >
              {isLoading && <span className="loading loading-spinner"></span>}
              Buy
            </button>
          </div>
        </div>
      </div>

      {/* Sell Modal */}
      <input type="checkbox" id={`sell-modal-${logId}`} className="modal-toggle" checked={showSellModal} onChange={() => {}} />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Sell Zora Coin</h3>
          <div className="py-4">
            <label className="label">
              <span className="label-text">Amount (Coins)</span>
            </label>
            <input 
              type="number" 
              placeholder="1" 
              className="input input-bordered w-full" 
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              step="1"
              min="0"
            />
          </div>
          <div className="modal-action">
            <button 
              className="btn"
              onClick={() => setShowSellModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-secondary"
              disabled={isLoading || !sellAmount || parseFloat(sellAmount) <= 0}
              onClick={handleSell}
            >
              {isLoading && <span className="loading loading-spinner"></span>}
              Sell
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
// import { createPublicClient, createWalletClient, custom, http } from "viem";
// import { tradeCoin } from "@zoralabs/coins-sdk"; // Temporarily removed from SDK
// import { base, baseSepolia } from "viem/chains";
// import ActiveChainContext from "~/contexts/ActiveChain";
// import { EIP1193, type Wallet } from "thirdweb/wallets";
import { Portal } from "../utils/Portal";
// import { client } from "~/providers/Thirdweb";

type Props = {
  referrer: string;
  coinAddress: string;
  logId: string;
}

export const ZoraCoinTrading: FC<Props> = ({ coinAddress: _coinAddress, logId, referrer: _referrer }) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  // const { activeChain } = useContext(ActiveChainContext);
  const [isLoading] = useState(false);
  const [buyAmount, setBuyAmount] = useState("0.001");
  const [sellAmount, setSellAmount] = useState("1");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  // Temporarily disabled while trading functionality is unavailable
  // const convertWalletToViem = (wallet: Wallet) => {
  //   const currentChain = activeChain.id === base.id ? base : baseSepolia;

  //   // Set up viem clients
  //   const publicClient = createPublicClient({
  //     chain: currentChain,
  //     transport: http(),
  //   });

  //   const provider = EIP1193.toProvider({
  //     client,
  //     wallet,
  //     chain: activeChain,
  //   });

  //   const walletClient = createWalletClient({
  //     chain: currentChain,
  //     transport: custom(provider),
  //   });

  //   return { walletClient, publicClient };
  // };

  const handleBuy = async () => {
    if (!account || !wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    // TODO: tradeCoin is not yet available in the current SDK version
    toast.info("Coin trading functionality is coming soon!");
    setShowBuyModal(false);
    return;

    /* Commented out until tradeCoin is available in the SDK
    setIsLoading(true);
    try {
      // const { walletClient, publicClient } = convertWalletToViem(wallet);

      // Define buy parameters
      // const buyParams = {
      //   direction: "buy" as const,
      //   target: coinAddress,
      //   args: {
      //     recipient: account.address,
      //     orderSize: parseEther(buyAmount),
      //     minAmountOut: 0n, // No minimum - adjust for slippage if needed
      //     tradeReferrer: referrer,
      //   }
      // };

      // Execute the buy
      // const result = await tradeCoin(buyParams, walletClient, publicClient); // Temporarily commented - function removed from SDK
      
      // TODO: Re-enable when tradeCoin is added back to @zoralabs/coins-sdk
      toast.error("Trading functionality temporarily unavailable");
      setShowBuyModal(false);
    } catch (error) {
      console.error("Buy error:", error);
      toast.error(`Failed to buy coin: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
    */
  };

  const handleSell = async () => {
    if (!account || !wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    // TODO: tradeCoin is not yet available in the current SDK version
    toast.info("Coin trading functionality is coming soon!");
    setShowSellModal(false);
    return;

    /* Commented out until tradeCoin is available in the SDK
    setIsLoading(true);
    try {
      // const { walletClient, publicClient } = convertWalletToViem(wallet);

      // Define sell parameters
      // const sellParams = {
      //   direction: "sell" as const,
      //   target: coinAddress,
      //   args: {
      //     recipient: account.address,
      //     orderSize: parseEther(sellAmount),
      //     minAmountOut: 0n, // No minimum - adjust for slippage if needed
      //     tradeReferrer: referrer,
      //   }
      // };

      // Execute the sell
      // const result = await tradeCoin(sellParams, walletClient, publicClient); // Temporarily commented - function removed from SDK
      
      // TODO: Re-enable when tradeCoin is added back to @zoralabs/coins-sdk
      toast.error("Trading functionality temporarily unavailable");
      setShowSellModal(false);
    } catch (error) {
      console.error("Sell error:", error);
      toast.error(`Failed to sell coin: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
    */
  };

  return (
    <div className="flex items-center gap-2">
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
      <Portal>
        <input type="checkbox" id={`buy-modal-${logId}`} className="modal-toggle" checked={showBuyModal} />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box relative card bg-opacity-65 backdrop-blur-lg shadow">
            <label onClick={() => void setShowBuyModal(false)} htmlFor={`buy-modal-${logId}`} className="btn btn-sm btn-ghost absolute right-4 top-4">✕</label>
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
                onChange={(e) => void setBuyAmount(e.target.value)}
                step="0.001"
                min="0"
              />
            </div>
            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => void setShowBuyModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success"
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
        <input type="checkbox" id={`sell-modal-${logId}`} className="modal-toggle" checked={showSellModal} />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box relative card bg-opacity-65 backdrop-blur-lg shadow">
            <label onClick={() => void setShowSellModal(false)} htmlFor={`sell-modal-${logId}`} className="btn btn-sm btn-ghost absolute right-4 top-4">✕</label>
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
                onChange={(e) => void setSellAmount(e.target.value)}
                step="1"
                min="0"
              />
            </div>
            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => void setShowSellModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                disabled={isLoading || !sellAmount || parseFloat(sellAmount) <= 0}
                onClick={handleSell}
              >
                {isLoading && <span className="loading loading-spinner"></span>}
                Sell
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
};

export default ZoraCoinTrading;
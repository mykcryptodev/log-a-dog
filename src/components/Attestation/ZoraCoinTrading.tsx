import { useState, useContext, type FC } from "react";
import { toast } from "react-toastify";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { tradeCoin, type TradeParameters } from "@zoralabs/coins-sdk";
import { parseEther } from "viem";
import { base, baseSepolia } from "viem/chains";
import ActiveChainContext from "~/contexts/ActiveChain";
import { FarcasterContext } from "~/providers/Farcaster";
import { EIP1193, type Wallet } from "thirdweb/wallets";
import { Portal } from "../utils/Portal";
import { client } from "~/providers/Thirdweb";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useWalletBalance } from "thirdweb/react";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/utils/api";

type Props = {
  referrer: string;
  coinAddress: string;
  logId: string;
  onTradeComplete?: () => void; // Optional callback after successful trade
}

export const ZoraCoinTrading: FC<Props> = ({ coinAddress: _coinAddress, logId, referrer: _referrer, onTradeComplete }) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { activeChain } = useContext(ActiveChainContext);
  const farcasterContext = useContext(FarcasterContext);
  const [isLoading, setIsLoading] = useState(false);
  const [buyAmount, setBuyAmount] = useState("0.0001");
  // const [sellAmount, setSellAmount] = useState("0.0001");
  const [buySlippage, setBuySlippage] = useState("0.5"); // Default 0.5%
  // const [sellSlippage, setSellSlippage] = useState("0.5"); // Default 0.5%
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

  // Get cache invalidation mutation
  const invalidateZoraCoinCache = api.hotdog.invalidateZoraCoinCache.useMutation();

  // Get ETH balance
  const { data: ethBalance } = useWalletBalance({
    client,
    chain: activeChain,
    address: account?.address,
  });

  const { data: tokenBalance } = useWalletBalance({
    client,
    chain: activeChain,
    address: account?.address,
    tokenAddress: _coinAddress,
  });

  const formatToMaxDecimals = (value?: string, decimals = 6) => {
    if (!value) return "0";
    const num = Number(value);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
      useGrouping: false,
    });
  };
  const ethBalanceFormatted = formatToMaxDecimals(ethBalance?.displayValue, 6);
  const tokenBalanceFormatted = formatToMaxDecimals(tokenBalance?.displayValue, 6);

  const convertWalletToViem = (wallet: Wallet, accountAddress: string) => {
    const currentChain = activeChain.id === base.id ? base : baseSepolia;

    // Set up viem clients
    const publicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });

    const provider = EIP1193.toProvider({
      client,
      wallet,
      chain: activeChain,
    });

    const walletClient = createWalletClient({
      account: accountAddress as `0x${string}`,
      chain: currentChain,
      transport: custom(provider),
    });
    
    return { walletClient, publicClient };
  };

  const handleBuy = async () => {
    if (!account || !wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    
    try {
      const { walletClient, publicClient } = convertWalletToViem(wallet, account.address);

      // Define buy parameters using new SDK API
      const tradeParameters: TradeParameters = {
        sell: { type: "eth" },
        buy: {
          type: "erc20",
          address: _coinAddress as `0x${string}`,
        },
        amountIn: parseEther(buyAmount),
        slippage: parseFloat(buySlippage) / 100, // Convert percentage to decimal
        sender: account.address as `0x${string}`,
      };

      // Execute the buy using new SDK API
      const receipt = await tradeCoin({
        tradeParameters,
        walletClient,
        account: walletClient.account,
        publicClient,
      }) as { transactionHash: string, hash: string };

      // Invalidate cache after successful buy
      try {
        await invalidateZoraCoinCache.mutateAsync({
          chainId: activeChain.id,
          coinAddress: _coinAddress,
        });
        onTradeComplete?.();
      } catch (cacheError) {
        // Don't let cache invalidation failure affect the trade success
        console.warn('Failed to invalidate Zora coin cache:', cacheError);
      }

      // Determine block explorer URL based on chain
      let explorerBaseUrl = "https://basescan.org/tx/";
      if (activeChain.id === baseSepolia.id) {
        explorerBaseUrl = "https://sepolia.basescan.org/tx/";
      }
      const txHash = receipt?.transactionHash ?? receipt?.hash;
      const explorerUrl = txHash ? `${explorerBaseUrl}${txHash}` : null;
      toast.success(
        explorerUrl
          ? <>You just bought this post! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-xs">View onchain</a></>
          : `You just bought ${buyAmount}!`
      );
      setShowTradeModal(false);
    } catch (error) {
      console.error("Buy error:", error);
      toast.error(`Failed to buy coin: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeButtonClick = async () => {
    // If user is in a Farcaster mini app, directly call swapToken
    if (farcasterContext?.isMiniApp && farcasterContext?.swapToken) {
      setIsLoading(true);
      try {
        await farcasterContext.swapToken(_coinAddress);
        toast.success("Swap opened in Farcaster!");
        
        // Invalidate cache after opening swap
        try {
          await invalidateZoraCoinCache.mutateAsync({
            chainId: activeChain.id,
            coinAddress: _coinAddress,
          });
          onTradeComplete?.();
        } catch (cacheError) {
          console.warn('Failed to invalidate Zora coin cache:', cacheError);
        }
      } catch (error) {
        console.error("Farcaster swap error:", error);
        toast.error("Failed to open swap in Farcaster");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Regular users open the modal
      setShowTradeModal(true);
    }
  };

  // const handleSell = async () => {
  //   if (!account || !wallet) {
  //     toast.error("Please connect your wallet");
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const { walletClient, publicClient } = convertWalletToViem(wallet, account.address);

  //     // Define sell parameters using new SDK API
  //     const tradeParameters: TradeParameters = {
  //       sell: {
  //         type: "erc20",
  //         address: _coinAddress as `0x${string}`,
  //       },
  //       buy: { type: "erc20", address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  //       amountIn: parseEther(sellAmount),
  //       slippage: parseFloat(sellSlippage) / 100, // Convert percentage to decimal
  //       sender: account.address as `0x${string}`,
  //     };

  //     // Execute the sell using new SDK API
  //     const receipt = await tradeCoin({
  //       tradeParameters,
  //       walletClient,
  //       account: walletClient.account,
  //       publicClient,
  //     });

  //     // Determine block explorer URL based on chain
  //     let explorerBaseUrl = "https://basescan.org/tx/";
  //     if (activeChain.id === baseSepolia.id) {
  //       explorerBaseUrl = "https://sepolia.basescan.org/tx/";
  //     }
  //     const txHash = receipt?.transactionHash ?? receipt?.hash;
  //     const explorerUrl = txHash ? `${explorerBaseUrl}${txHash}` : null;

  //     toast.success(
  //       explorerUrl
  //         ? <>You just sold {sellAmount}! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">View onchain</a></>
  //         : `You just sold ${sellAmount}!`
  //     );
  //     setShowTradeModal(false);
  //   } catch (error) {
  //     console.error("Sell error:", error);
  //     toast.error(`Failed to sell coin: ${error instanceof Error ? error.message : String(error)}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <div className="flex items-center gap-2">
      <button 
        className="btn btn-ghost btn-xs"
        onClick={handleTradeButtonClick}
        disabled={isLoading}
      >
        {isLoading && <span className="loading loading-spinner loading-xs"></span>}
        <ArrowsRightLeftIcon className="w-4 h-4" />
        Trade
      </button>

      {/* Trade Modal */}
      <Portal>
        <input type="checkbox" id={`trade-modal-${logId}`} className="modal-toggle" checked={showTradeModal} />
        <div className="modal modal-bottom sm:modal-middle" role="dialog">
          <div className="modal-box relative card bg-opacity-65 backdrop-blur-lg shadow">
            <label onClick={() => void setShowTradeModal(false)} htmlFor={`trade-modal-${logId}`} className="btn btn-sm btn-ghost absolute right-4 top-4">✕</label>
            <h3 className="font-bold text-lg">Trade</h3>
            <p className="text-sm opacity-50">Every post can be bought and sold on the blockchain!</p>
            <p className="text-sm opacity-50">The eater earns fees on every trade.</p>
            
            {/* Tabs */}
            <div className="tabs tabs-boxed mt-4">
              <button 
                className={`tab ${activeTab === "buy" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("buy")}
              >
                Buy
              </button>
              <button 
                className={`tab ${activeTab === "sell" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("sell")}
              >
                Sell
              </button>
            </div>

            {/* Buy Tab Content */}
            {activeTab === "buy" && (
              <div className="py-4">
                {/* Balance Display */}
                <div className="bg-base-200 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Your Balance:</span>
                    <div className="text-right">
                      <div className="text-sm">{ethBalanceFormatted} ETH</div>
                      <div className="text-xs opacity-70">{tokenBalanceFormatted} Coins</div>
                    </div>
                  </div>
                </div>

                <label className="label">
                  <span className="label-text">Amount (ETH)</span>
                  <span className="label-text-alt">
                    <button 
                      className="btn btn-xs btn-ghost mr-4"
                      onClick={() => setBuyAmount((Number(ethBalance?.displayValue ?? "0") * 0.5).toString())}
                      disabled={!ethBalance || Number(ethBalance?.displayValue ?? "0") <= 0}
                    >
                      50%
                    </button>
                    <button 
                      className="btn btn-xs btn-ghost"
                      onClick={() => setBuyAmount(ethBalance?.displayValue ?? "0")}
                      disabled={!ethBalance || parseFloat(ethBalance?.displayValue ?? "0") <= 0}
                    >
                      Max
                    </button>
                  </span>
                </label>
                <input 
                  type="number" 
                  placeholder="0.0001" 
                  className="input input-bordered w-full" 
                  value={buyAmount}
                  onChange={(e) => void setBuyAmount(e.target.value)}
                  step="0.0001"
                  min="0"
                  max={ethBalanceFormatted}
                />
                
                <label className="label mt-4">
                  <span className="label-text">Slippage Tolerance (%)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="0.5" 
                  className="input input-bordered w-full" 
                  value={buySlippage}
                  onChange={(e) => void setBuySlippage(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="50"
                />
              </div>
            )}

            {/* Sell Tab Content */}
            {activeTab === "sell" && (
              <div className="py-4">
                {/* Balance Display */}
                <div className="bg-base-200 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Your Balance:</span>
                    <div className="text-right">
                      <div className="text-sm">{tokenBalanceFormatted} Coins</div>
                      <div className="text-xs opacity-70">{ethBalanceFormatted} ETH</div>
                    </div>
                  </div>
                </div>

                <p className="text-sm">Selling is currently only available on the Zora site</p>
                <p className="text-xs opacity-50">Zora is the blockchain protocol that powers the trading of logged dogs</p>

                {/* <label className="label">
                  <span className="label-text">Amount (Coins)</span>
                  <span className="label-text-alt">
                    <button 
                      className="btn btn-xs btn-ghost mr-4"
                      onClick={() => setSellAmount((Number(tokenBalance?.displayValue ?? "0") * 0.5).toString())}
                      disabled={!tokenBalance || Number(tokenBalance?.displayValue ?? "0") <= 0}
                    >
                      50%
                    </button>
                    <button 
                      className="btn btn-xs btn-ghost"
                      onClick={() => setSellAmount(tokenBalance?.displayValue ?? "0")}
                      disabled={!tokenBalance || parseFloat(tokenBalance?.displayValue ?? "0") <= 0}
                    >
                      Max
                    </button>
                  </span>
                </label>
                <input 
                  type="number" 
                  placeholder="0.0001" 
                  className="input input-bordered w-full" 
                  value={sellAmount}
                  onChange={(e) => void setSellAmount(e.target.value)}
                  step="0.0001"
                  min="0"
                  max={tokenBalanceFormatted}
                />
                
                <label className="label mt-4">
                  <span className="label-text">Slippage Tolerance (%)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="0.5" 
                  className="input input-bordered w-full" 
                  value={sellSlippage}
                  onChange={(e) => void setSellSlippage(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="50"
                /> */}
              </div>
            )}

            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => void setShowTradeModal(false)}
              >
                Cancel
              </button>
              
              {activeTab === "buy" ? (
                <button 
                  className="btn btn-success"
                  disabled={isLoading || !buyAmount || parseFloat(buyAmount) <= 0}
                  onClick={handleBuy}
                >
                  {isLoading && <span className="loading loading-spinner"></span>}
                  Buy
                </button>
              ) : (
                // <button 
                //   className="btn btn-error"
                //   disabled={isLoading || !sellAmount || parseFloat(sellAmount) <= 0}
                //   onClick={handleSell}
                // >
                //   {isLoading && <span className="loading loading-spinner"></span>}
                //   Sell
                // </button>
                <Link 
                  className="btn btn-secondary"
                  href={`https://zora.co/coin/base:${_coinAddress}?referrer=0x3dE0ba94A1F291A7c44bb029b765ADB2C487063F`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {isLoading && <span className="loading loading-spinner"></span>}
                  Sell on
                  <Image
                    src="/images/zorb.svg"
                    alt="Zora"
                    width={12}
                    height={12}
                    className="-mr-1"
                  />
                  Zora
                </Link>
              )}
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
};

export default ZoraCoinTrading;
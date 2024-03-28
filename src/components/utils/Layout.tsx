import { useActiveAccount, useConnect } from "thirdweb/react";
import { type FC, type ReactNode,useEffect, useState, useMemo, useCallback, useContext } from "react"
import { ToastContainer } from 'react-toastify';
import { ProfileButton } from "../Profile/Button";
import { useRouter } from "next/router";
import { coinbaseWaaS } from "~/wallet/CoinbaseWaas";
import { type SmartWalletOptions, smartWallet } from "thirdweb/wallets";
import { SMART_WALLET_BUNDLER_URL, SMART_WALLET_ENTRYPOINT, SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import ActiveChainContext from "~/contexts/ActiveChain";
import Changelog from "~/components/utils/Changelog";
import Link from "next/link";

interface LayoutProps {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { activeChain } = useContext(ActiveChainContext);
  // sign out user and clear session if connected wallet changes
  const account = useActiveAccount();

  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  useEffect(() => {
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);


  const { connect, isConnecting } = useConnect();

  const smartWalletOptions: SmartWalletOptions = useMemo(() => {
    return {
      client,
      chain: activeChain,
      factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
      gasless: true,
      overrides: {
        entrypointAddress: SMART_WALLET_ENTRYPOINT[activeChain.id],
        bundlerUrl: SMART_WALLET_BUNDLER_URL[activeChain.id],
        paymasterAddress: SMART_WALLET_BUNDLER_URL[activeChain.id],
      }
    }
  }, [activeChain]);
  
  const [customAutoConnectIsLoading, setCustomAutoConnectIsLoading] = useState<boolean>(false);
  const autoConnect = useCallback(async () => {
    setCustomAutoConnectIsLoading(true);
    try {
      await connect(async () => {
        const wallet = coinbaseWaaS({
          appName: "Log a Dog",
          chainId: activeChain.id,
        });
        const personalAccount = await wallet.autoConnect();
        const aaWallet = smartWallet(smartWalletOptions);
        await aaWallet.connect({ personalAccount });
        return aaWallet;
      });
    } catch (e) {
      console.log('error auto connecting', e);
    } finally {
      setCustomAutoConnectIsLoading(false);
    }
  }, [activeChain.id, connect, smartWalletOptions]);

  useEffect(() => {
    if (!account) {
      void autoConnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fromYellow = userPrefersDarkMode ? "from-yellow-300" : "from-yellow-100";
  const toYellow = userPrefersDarkMode ? "to-yellow-800" : "to-yellow-00";
  const fromPink = userPrefersDarkMode ? "from-pink-300" : "from-pink-100";
  const toPink = userPrefersDarkMode ? "to-pink-800" : "to-pink-500";
  const viaPink = userPrefersDarkMode ? "via-pink-300" : "via-pink-200";

  return (
    <div className="block">
      <div className={`absolute bg-gradient-to-t ${fromYellow} ${toYellow} rounded-full blur-3xl -top-[75%] -left-[45%] w-full h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`} ></div>
      <div className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} rounded-full blur-3xl -bottom-0 -right-[90%] w-full h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      <div className={`fixed bg-gradient-to-br ${fromYellow} ${viaPink} ${toPink} rounded-full blur-3xl -bottom-0 -left-[55%] w-1/2 h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      <div className={`fixed bg-gradient-to-tl ${fromYellow} ${viaPink} ${toYellow} rounded-full blur-3xl -bottom-0 -left-[25%] w-1/2 h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      <div className={`fixed bg-gradient-to-bl ${fromPink} ${toPink} rounded-full -top-[-85%] blur-3xl -left-[35%] w-full h-full -z-10 ${userPrefersDarkMode ? 'opacity-30' : ''}`}></div>
      <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen mt-10">
        <div className="w-full justify-between items-center flex mr-4">
          <div className="flex items-center gap-2">
            {router.pathname !== '/' && (
              <Link href="/" className="btn btn-ghost text-neutral ml-4">
                🌭  Log a Dog
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {customAutoConnectIsLoading || isConnecting ? (
              <button className="btn mr-4" disabled>
                <div className="loading loading-spinner" /> Login
              </button>
            ) : (
              <ProfileButton />
            )}
            <Changelog />
          </div>
        </div>
        <ToastContainer />
        {children}
      </div>
    </div>
  )
}
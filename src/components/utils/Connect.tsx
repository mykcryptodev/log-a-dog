import { type FC, useMemo, useContext, useState, useEffect } from "react";
import { ConnectButton } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { createWallet, inAppWallet, walletConnect, type SmartWalletOptions } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";
import { AtSymbolIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

type Props = {
  loginBtnLabel?: string;
}
export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  useEffect(() => {
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const smartWalletOptions: SmartWalletOptions = useMemo(() => {
    return {
      client,
      chain: activeChain,
      factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
      gasless: true,
    }
  }, [activeChain]);

  const cryptoWallets = [
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    walletConnect(),
  ];

  return (
    <div>
      {/* The button to open modal */}
      <label htmlFor="login_modal" className="btn">{loginBtnLabel ?? 'Login'}</label>

      {/* Put this part before </body> tag */}
      <input type="checkbox" id="login_modal" className="modal-toggle" />
      <div className="modal modal-bottom sm:modal-middle" role="dialog">
        <div className="modal-box">
          <label htmlFor="login_modal" className="btn btn-sm btn-circle btn-ghost absolute right-5 top-5 text-lg">
            &times;
          </label>
          <div className="flex gap-2 items-center pb-2">
            <Image src="/images/logo.png" alt="Logo" width={24} height={24} />
            <h3 className="font-bold text-lg">Login to Log a Dog</h3>
          </div>
          <div className="sm:max-h-[26rem] max-h-96 p-4 overflow-y-scroll rounded-lg shadow-inner relative">
            <div className={`h-full w-full top-0 left-0 absolute bg-gradient-to-br from-pink-100 to-yellow-100 -z-10 sm:block hidden ${userPrefersDarkMode ? 'invisible' : ''}`} />
            <div className="rounded-lg flex flex-col gap-2 pt-0 items-center justify-center">
              <div className="flex md:flex-row flex-col items-center gap-2 justify-between w-full p-4 rounded-lg border border-neutral-content bg-base-100">
                <span className="text-sm flex items-start gap-2">
                  <Image 
                    src="/images/coinbase-wallet.png"
                    className="h-6 w-6 mt-2 rounded"
                    width={40}
                    height={40} 
                    alt={"Coinbase Wallet"}
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">Login with Smart Wallet</span>
                    <span className="flex items-center text-xs opacity-80">Powered by <Image className="ml-1 mr-0.5 w-4 h-auto" width={48} height={48} src={"/images/coinbase.png"} alt={"Coinbase"} /> Coinbase</span>
                  </div>
                </span>
                <div className="flex justify-end">
                  <ConnectButton
                    client={client}
                    chain={activeChain}
                    theme={userPrefersDarkMode ? "dark" : "light"}
                    connectButton={{
                      label: "Sign with passkey",
                      className: "thirdweb-btn",
                    }}
                    wallets={[createWallet("com.coinbase.wallet")]}
                  />
                </div>
              </div>
              <div className="flex md:flex-row flex-col items-center gap-2 justify-between w-full p-4 rounded-lg border border-neutral-content bg-base-100">
                <span className="text-sm flex items-start gap-2">
                  <DevicePhoneMobileIcon className="h-5 w-5 stroke-2 mt-2" />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">Login with phone</span>
                    <span className="text-xs flex items-center opacity-80">Powered by <Image className="ml-1 mr-0.5 w-4 h-auto" width={48} height={48} src={"/images/thirdweb.png"} alt={"Thirdweb"} /> Thirdweb</span>
                  </div>
                </span>
                <div className="flex justify-end">
                  <ConnectButton
                    accountAbstraction={smartWalletOptions}
                    client={client}
                    chain={activeChain}
                    theme={userPrefersDarkMode ? "dark" : "light"}
                    connectButton={{
                      label: "Get texted a code",
                      className: "thirdweb-btn",
                    }}
                    wallets={[
                      inAppWallet({
                        auth: {
                          options: ['phone']
                        }
                      }),
                    ]}
                  />
                </div>
              </div>
              <div className="flex md:flex-row flex-col items-center gap-2 justify-between w-full p-4 rounded-lg border border-neutral-content bg-base-100">
                <span className="text-sm flex items-start gap-2">
                  <AtSymbolIcon className="h-5 w-5 stroke-2 mt-2" />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">Login with email</span>
                    <span className="text-xs flex items-center opacity-80">Powered by <Image className="ml-1 mr-0.5 w-4 h-auto" width={48} height={48} src={"/images/thirdweb.png"} alt={"Thirdweb"} /> Thirdweb</span>
                  </div>
                </span>
                <div className="flex justify-end">
                  <ConnectButton
                    accountAbstraction={smartWalletOptions}
                    client={client}
                    chain={activeChain}
                    theme={userPrefersDarkMode ? "dark" : "light"}
                    connectButton={{
                      label: "Get emailed a code",
                      className: "thirdweb-btn",
                    }}
                    wallets={[
                      inAppWallet({
                        auth: {
                          options: ['email']
                        }
                      }),
                    ]}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center w-full">
              <ConnectButton
                client={client}
                chain={activeChain}
                theme={userPrefersDarkMode ? "dark" : "light"}
                connectButton={{
                  label: "Login with a crypto wallet",
                  className: `thirdweb-btn-xs-link-neutral${userPrefersDarkMode ? '-content' : ''}`,
                }}
                connectModal={{
                  title: "Login to Log a Dog",
                  titleIcon: "/images/logo.png",
                  welcomeScreen: {
                    title: "Login to Log a Dog",
                    img: {
                      src: "/images/logo.png",
                    }
                  },
                  showThirdwebBranding: false,
                }}
                recommendedWallets={[createWallet("com.coinbase.wallet")]}
                wallets={cryptoWallets}
                showAllWallets={true}
              />
            </div>
          </div>
          <div className="modal-action">
            <label htmlFor="login_modal" className="btn btn-ghost">Cancel</label>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Connect;
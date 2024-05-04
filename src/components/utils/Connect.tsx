import { type FC, useMemo, useContext, useState, type SVGProps } from "react";
import { ConnectButton, useConnect } from "thirdweb/react";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { createWallet, inAppWallet, smartWallet, walletConnect, type SmartWalletOptions } from "thirdweb/wallets";
import ActiveChainContext from "~/contexts/ActiveChain";
import { toViem } from "@coinbase/waas-sdk-viem";
import { ProtocolFamily } from "@coinbase/waas-sdk-web";
import { createWalletClient, http } from "viem";
import { baseSepolia as viemBaseSepolia, base as viemBase } from "viem/chains";
import { viemAdapter } from "thirdweb/adapters/viem";
import { InitializeWaas, type Wallet } from "@coinbase/waas-sdk-web";
import { COINBASE_WAAS_PROJECT_ID } from "~/constants";
import { AtSymbolIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import useIsOnMobileSafari from "~/hooks/useIsOnMobileSafari";

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
	return (<svg xmlns="http://www.w3.org/2000/svg" width="0.98em" height="1em" viewBox="0 0 256 262" {...props}><path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path><path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path><path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path><path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path></svg>);
}

type Props = {
  loginBtnLabel?: string;
}
export const Connect: FC<Props> = ({ loginBtnLabel }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { isOnMobileSafari } = useIsOnMobileSafari();

  const smartWalletOptions: SmartWalletOptions = useMemo(() => {
    return {
      client,
      chain: activeChain,
      factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
      gasless: true,
    }
  }, [activeChain]);
  const { connect } = useConnect();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

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
          <div className="flex gap-2 items-center">
            <Image src="/images/logo.png" alt="Logo" width={24} height={24} />
            <h3 className="font-bold text-lg">Login to Log a Dog</h3>
          </div>
          <div className="rounded-lg flex flex-col gap-2 pt-8 items-center justify-center">
            <div className="flex md:flex-row flex-col items-center gap-2 justify-between w-full p-4 rounded-lg border border-neutral-content text-neutral-content bg-neutral">
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
            <div className="flex md:flex-row flex-col items-center gap-2 justify-between w-full p-4 rounded-lg border border-neutral-content text-neutral-content bg-neutral">
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
            <div className="flex md:flex-row flex-col items-center gap-2 justify-between w-full p-4 rounded-lg border border-neutral-content text-neutral-content bg-neutral">
              <span className="text-sm flex items-start gap-2">
                <GoogleIcon className="h-5 w-5 mt-2" />
                <div className="flex flex-col">
                  <span className="font-bold text-lg">Login with Google</span>
                  <span className="flex items-center text-xs opacity-80">Powered by <Image className="ml-1 mr-0.5 w-4 h-auto" width={48} height={48} src={"/images/coinbase.png"} alt={"Coinbase"} /> Coinbase</span>
                </div>
              </span>
              <button
                className="btn"
                disabled={isConnecting || isOnMobileSafari}
                onClick={async () => {
                  setIsConnecting(true);
                  // connect embedded wallet
                  const waas = await InitializeWaas({
                    collectAndReportMetrics: true,
                    enableHostedBackups: true, // DO NOT CHANGE THIS TO FALSE
                    projectId: COINBASE_WAAS_PROJECT_ID[activeChain.id],
                    prod: process.env.NODE_ENV === "production",
                  });
                  const user = await waas.auth.login();
                  let wallet: Wallet;
                  if (waas.wallets.wallet) {
                    wallet = waas.wallets.wallet;
                    console.log("wallet is resumed");
                  } else if (user.hasWallet) {
                    wallet = await waas.wallets.restoreFromHostedBackup();
                    console.log("wallet is restored");
                  } else {
                    wallet = await waas.wallets.create();
                    console.log("wallet is created");
                  }
                  if (!wallet) return;
                  // convert the wallet to viem
                  const address = await wallet.addresses.for(ProtocolFamily.EVM);
                  const viemAccount = toViem(address);
                  const viemChain = activeChain.id === viemBaseSepolia.id ? viemBaseSepolia : viemBase;
            
                  const walletClient = createWalletClient({
                    account: viemAccount,
                    chain: viemChain,
                    transport: http(activeChain.rpc),
                  });
                  // convert the viem account to personal account
                  const personalAccount = viemAdapter.walletClient.fromViem({ walletClient });
                  // connect the smart wallet and return the smart account
                  return await connect(async () => {
                    // connect personal acct to smart wallet
                    const aaWallet = smartWallet(smartWalletOptions);
                    await aaWallet.connect({ personalAccount, client });
                    // return the smart wallet
                    return aaWallet;
                  });
                }}
              >
                {isConnecting && (
                  <div className="loading loading-spinner" />
                )}
                {isOnMobileSafari ? "Not available on mobile safari" : "Connect with Google"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <ConnectButton
              client={client}
              chain={activeChain}
              connectButton={{
                label: "Login with a crypto wallet",
                className: "thirdweb-btn-xs-ghost",
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
              }}
              recommendedWallets={[createWallet("com.coinbase.wallet")]}
              wallets={cryptoWallets}
              showAllWallets={true}
            />
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
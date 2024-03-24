import { useContext, type FC, useMemo, useEffect, useState } from "react";
import { ConnectButton, smartWalletConfig, useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import { uint8ArrayToHex, stringToHex } from "thirdweb";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";
import { ProfileForm } from "~/components/Profile/Form";
import { client } from "~/providers/Thirdweb";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { env } from "~/env";
import { coinbaseWaasConfig } from "~/wallet/CoinbaseWaasConfig";
import { baseSepolia } from "thirdweb/chains";
import { useWalletContext } from "@coinbase/waas-sdk-web-react";
import { toViem } from "@coinbase/waas-sdk-viem";
import { type Address, type ProtocolFamily } from "@coinbase/waas-sdk-web";
import { type LocalAccount, createWalletClient, http } from "viem";
import { baseSepolia as viemBaseSepolia, base as viemBase } from "viem/chains";
import { smartWallet, type Account } from "thirdweb/wallets";
import { viemAdapter } from "thirdweb/adapters/viem";

const stringify: typeof JSON.stringify = (value, replacer, space) => {
  return JSON.stringify(
    value,
    (key, value_) => {
      const value__ = typeof value_ === "bigint" ? value_.toString() : value_ as string;
      return typeof replacer === "function" ? replacer(key, value__) as string : value__;
    },
    space
  );
};

type Props = {
  onProfileCreated?: (profile: {
    username: string;
    imgUrl: string;
    metadata?: string;
  }) => void;
  loginBtnLabel?: string;
  createProfileBtnLabel?: string;
}
export const ProfileButton: FC<Props> = ({ onProfileCreated, loginBtnLabel, createProfileBtnLabel }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const activeWalletChain = useActiveWalletChain();
  const switchActiveWalletChain = useSwitchActiveWalletChain();
  const account = useActiveAccount();
  const { data, refetch } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  // const smartWalletOptions = useMemo(() => ({
  //   chain: activeChain,
  //   factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
  //   clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
  //   gasless: true,
  // }), [activeChain]);
  const smartWalletOptions = {
    chain: baseSepolia,
    factoryAddress: SMART_WALLET_FACTORY[baseSepolia.id]!,
    clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    gasless: true,
  }

  const smartWalletConnector = useMemo(() => {
    return smartWallet({
      chain: activeChain,
      factoryAddress: SMART_WALLET_FACTORY[activeChain.id]!,
      client,
      gasless: true,
    });
  }, [activeChain]);

  // const { waas, user, isCreatingWallet, wallet, isLoggingIn } = useWalletContext();

  // // Login the user.
  // const handleLogin = async () => {
  //   await waas?.login();
  // }
  
  // // Logout the user.
  // const handleLogout = async () => {
  //   await waas?.logout();
  // }
  
  // Automatically creating or restoring a wallet for a user.
  // useEffect(() => {
  //   // If the user is not yet logged in, the wallet is already loaded,
  //   // or the wallet is loading, do nothing.
  //   // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  //   if (!user || wallet || isCreatingWallet) return;
  
  //   // NOTE: This will trigger a reflow of you component, and `wallet` will be set
  //   // to the created or restored wallet.
  //   if (user.hasWallet) {
  //     void user.restoreFromHostedBackup?.(/* optional user-specified passcode */);
  //   } else {
  //     void user.create(/* optional user-specified passcode */);
  //   }
  // }, [user, wallet, isCreatingWallet]);

  // const [viemAccount, setViemAccount] = useState<LocalAccount>();
  // const [thirdwebAccount, setThirdwebAccount] = useState<Account>();
  // useEffect(() => {
  //   if (!wallet) return;
  //   const convertToViem = async () => {
  //     const addresses = await wallet.addresses.all();
  //     const firstEvmAddress = addresses.find(addr => 
  //       addr.protocolFamily === "protocolFamilies/evm"
  //     ) as Address<ProtocolFamily> | undefined;
  //     if (!firstEvmAddress?.address) return;
  //     const viemAccount = toViem(firstEvmAddress);
  //     // ethersSigner.connect();
  //     // const account = await ethers6Adapter.signer.fromEthers(ethersSigner);
  //     // setThirdwebAccount(account);
  //     setViemAccount(viemAccount);
  //   }
  //   void convertToViem();
  // }, [wallet]);

  // useEffect(() => {
  //   if (!viemAccount || thirdwebAccount) return;
  //   const viemChain = activeChain.id === viemBase.id ? viemBase : viemBaseSepolia;
  //   const walletClient = createWalletClient({
  //     account: viemAccount,
  //     chain: viemChain,
  //     transport: http(activeChain.rpc),
  //   });
  //   const account = viemAdapter.walletClient.fromViem({ walletClient });
  //   setThirdwebAccount(account);
  //   console.log({ walletClient, viemChain, account, viemAccount });
  //   // const account: Account = {
  //   //   address: viemAccount.address,
  //   //   async signTypedData(typedData) {
  //   //     const { domain, message, primaryType } =
  //   //       typedData as unknown as SignTypedDataParameters;

  //   //     const types = {
  //   //       EIP712Domain: getTypesForEIP712Domain({ domain }),
  //   //       ...typedData.types,
  //   //     };

  //   //     // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
  //   //     // as we can't statically check this with TypeScript.
  //   //     validateTypedData({ domain, message, primaryType, types });

  //   //     return await walletClient.signTypedData({
  //   //       account: viemAccount,
  //   //       domain,
  //   //       types,
  //   //       primaryType,
  //   //       message,
  //   //     });
  //   //   },
  //   //   async signMessage({ message }) {
  //   //     if (typeof message === "string") {          
  //   //       return await walletClient.signMessage({ 
  //   //         account: viemAccount,
  //   //         message: { raw: stringToHex(message) },
  //   //       });
  //   //     }

  //   //     const { raw } = message as { raw: Uint8Array };

  //   //     return await walletClient.signMessage({
  //   //       account: viemAccount,
  //   //       message: { raw: uint8ArrayToHex(raw) },
  //   //     });
  //   //   },
  //   //   async sendTransaction(tx: SendTransactionOption) {  
  //   //     const transactionHash = await walletClient.sendTransaction({
  //   //       account: viemAccount,
  //   //       to: tx.to,
  //   //       value: tx.value,
  //   //     });
  //   //     return {
  //   //       transactionHash,
  //   //     };
  //   //   },
  //   // }
  //   // setThirdwebAccount(account);
  // }, [account?.address, activeChain.id, activeChain.rpc, smartWalletConnector, thirdwebAccount, viemAccount]);

  const connectSmartAccount = async () => {
    console.log("no account?", !account)
    if (!account) return;
    console.log('connecting...', account)
    try {
      await smartWalletConnector.connect({
        personalAccount: account,
      });
      console.log('connected!')
    } catch (e) {
      console.log('error ', e)
    }
  }

  // if (!waas) return <div>WaaS Not Initialized</div>;

  // if (!viemAccount) return (
  //   <div>
  //     {!user && !isLoggingIn && <button onClick={handleLogin}>Login</button>}
  //     {user && <p>User is logged in!</p>}
  //     {wallet && <p>Wallet is loaded</p>}
  //     {user && <button onClick={handleLogout}>Logout</button>}
  //   </div>
  // );

  console.log({ account, activeChain, activeWalletChain })

  if (!account) return (
    <div className="mr-4">
      <ConnectButton 
        connectButton={{
          label: loginBtnLabel ?? "Login"
        }}
        connectModal={{
          title: "Login to Log a Dog",
          showThirdwebBranding: false,
          titleIcon: "https://logadog.xyz/images/logo.png",
        }} 
        client={client} 
        appMetadata={{
          name: "Log a Dog",
          url: "https://logadog.xyz",
          description: "Who can eat the most hotdogs onchain?",
          logoUrl: "https://logadog.xyz/images/logo.png"
        }}
        wallets={[
          smartWalletConfig(
            coinbaseWaasConfig(), smartWalletOptions
          ),
          // coinbaseWaasConfig(),
        ]}
        chain={baseSepolia}
      />
    </div>
  )

  if (!data?.username) return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button className="btn mr-4" onClick={()=>(document.getElementById('create_profile_modal') as HTMLDialogElement).showModal()}>
        {createProfileBtnLabel ?? 'Create Profile'}
      </button>
      <dialog id="create_profile_modal" className="modal">
        <div className="modal-box relative">
          <button 
            className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4"
            onClick={()=>(document.getElementById('create_profile_modal') as HTMLDialogElement).close()}
          >
            &times;
          </button>
          <h3 className="font-bold text-2xl mb-4">Create Profile</h3>
          <ProfileForm
            onProfileCreated={(profile) => {
              void refetch();
              console.log("refetching profile", profile);
              onProfileCreated?.(profile);
            }}
          />
        </div>
      </dialog>
    </>
  );

  const imageUrl = data.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (
    <div className="mr-4">
      <ConnectButton
        connectModal={{
          title: "Login to Log a Dog",
          showThirdwebBranding: false,
          titleIcon: "https://logadog.xyz/images/logo.png",
          welcomeScreen: {
            title: "Log a Dog",
            subtitle: "Login to Log a Dog",
            img: {
              src: "https://logadog.xyz/images/logo.png",
            }
          }
        }}
        detailsModal={{
          hideSwitchToPersonalWallet: true,
          showTestnetFaucet: false,
        }}
        detailsButton={{
          render: () => (
            <button className="btn btn-ghost">
              <div className="flex items-center gap-2">
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <Image
                      src={imageUrl}
                      alt="profile"
                      width={48}
                      height={48} />
                  </div>
                </div>
                <span>{data.username}</span>
              </div>
            </button>
          )
        }}
        connectButton={{
          label: loginBtnLabel ?? "Login"
        }} 
        client={client} 
        appMetadata={{
          name: "Log a Dog",
          url: "https://logadog.xyz",
          description: "Who can eat the most hotdogs onchain?",
          logoUrl: "https://logadog.xyz/images/logo.png"
        }}
        wallets={[
          smartWalletConfig(
            coinbaseWaasConfig(), smartWalletOptions
          ),
        ]}
      />
    </div>
  )
};
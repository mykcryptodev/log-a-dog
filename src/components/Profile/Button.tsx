import { useContext, type FC } from "react";
import { ConnectButton, smartWalletConfig, useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";
import { ProfileForm } from "~/components/Profile/Form";
import { client } from "~/providers/Thirdweb";
import { SMART_WALLET_FACTORY } from "~/constants/addresses";
import { env } from "~/env";
import { coinbaseWaasConfig } from "~/wallet/CoinbaseWaasConfig";
import { baseSepolia } from "thirdweb/chains";
import Connect from "~/components/utils/Connect";
import { useDisconnect } from "thirdweb/react";

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
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  console.log({ account });
  const { disconnect } = useDisconnect();

  const { data, refetch } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const smartWalletOptions = {
    chain: baseSepolia,
    factoryAddress: SMART_WALLET_FACTORY[baseSepolia.id]!,
    clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    gasless: true,
  }
  const deletePersistCookies = async () => {
    const resp = await fetch("/api/persist/deletePersist", {
      method: "delete",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    }).then(r => r.json()) as { message: string };
    return resp.message;
  };

  const logout = async () => {
    await deletePersistCookies();
    if (wallet) {
      void disconnect(wallet);
    }
  }

  if (!account) return (
    <div className="mr-4">
      <Connect loginBtnLabel={loginBtnLabel} />
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
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost">
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
        </div>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><a onClick={() => void logout()}>Logout</a></li>
        </ul>
      </div>
      {/* <ConnectButton
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
      /> */}
    </div>
  )
};
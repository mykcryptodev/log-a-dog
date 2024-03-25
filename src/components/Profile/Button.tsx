import { useContext, useEffect, type FC, useState } from "react";
import { ConnectButton, smartWalletConfig, useActiveAccount } from "thirdweb/react";
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
import { type VerifyLoginPayloadParams, signLoginPayload } from "thirdweb/auth";

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

  // persist the login locally
  const { data: loginPayload } = api.auth.receivePayload.useQuery({
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const [signedPayload, setSignedPayload] = useState<VerifyLoginPayloadParams>();
  const { data: authTokens } = api.auth.receiveToken.useQuery({
    payload: {
      signature: signedPayload?.signature ?? "",
      loginPayload: signedPayload?.payload as unknown as string ?? "",
    },
  }, {
    enabled: !!signedPayload,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  console.log({ loginPayload, authTokens, account });

  useEffect(() => {
    const sign = async () => {
      if (loginPayload && account) {
        const { signature, payload } = await signLoginPayload({
          payload: loginPayload,
          account: account,
        });
        setSignedPayload({ payload, signature });
      }
    }
    if (!account || !loginPayload) return;
    void sign();
  }, [account, loginPayload]);

  useEffect(() => {
    if (document && authTokens) {
      document.cookie = `logDogXyz=${authTokens.jwt}; Path=/; HttpOnly; Secure; SameSite=Strict`;
    }
  }, [authTokens]);

  if (!account) return (
    <div className="mr-4">
      <Connect />
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
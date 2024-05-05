import { useContext, type FC, useState } from "react";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { ProfileForm } from "~/components/Profile/Form";
import Connect from "~/components/utils/Connect";
import { useDisconnect } from "thirdweb/react";
import { Logout } from "@coinbase/waas-sdk-web";
import { client } from "~/providers/Thirdweb";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWalletContext } from "@coinbase/waas-sdk-web-react";

const CustomMediaRenderer = dynamic(
  () => import('~/components/utils/CustomMediaRenderer'),
  { ssr: false }
);
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
  const { waas } = useWalletContext();
  const { disconnect } = useDisconnect();
  const [createdProfileImgUrl, setCreatedProfileImgUrl] = useState<string>();

  const { data, isLoading, refetch } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const logout = async () => {
    console.log('logging out...')
    await waas?.logout();
    if (wallet) {
      console.log('still logging out...')
      void disconnect(wallet);
      await waas?.logout();
      void Logout();
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
      <button className="btn mr-2" onClick={()=>(document.getElementById('create_profile_modal') as HTMLDialogElement).showModal()}>
        {createProfileBtnLabel ?? 'Create Profile'}
      </button>
      <button className="btn btn-ghost mr-4" onClick={() => void logout()}>
        Logout <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
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
            onProfileSaved={(profile) => {
              void refetch();
              console.log("refetching profile", profile);
              onProfileCreated?.(profile);
              setCreatedProfileImgUrl(profile.imgUrl);
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
            {isLoading ? (
              <>
                <div className="h-8 w-8 bg-base-200 rounded-full animate-pulse" />
                <div className="h-5 w-24 bg-base-200 rounded-lg animate-pulse" />
              </>
            ) : (
              <>
                <CustomMediaRenderer
                  src={createdProfileImgUrl ?? imageUrl ?? '/images/logo.png'}
                  alt="Profile Pic"
                  width={"24px"}
                  height={"24px"} 
                  className="rounded-full"
                  client={client}
                />
                <span>{data?.username}</span>
              </>
            )}
          </div>
        </div>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li>
            <Link href={`/profile/${data.username}`}>
              Profile
            </Link>
          </li>
          <li><a onClick={() => void logout()}>Logout</a></li>
        </ul>
      </div>
    </div>
  )
};
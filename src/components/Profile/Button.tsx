import { useContext, type FC } from "react";
import { MediaRenderer, useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { ProfileForm } from "~/components/Profile/Form";
import Connect from "~/components/utils/Connect";
import { useDisconnect } from "thirdweb/react";
import { Logout } from "@coinbase/waas-sdk-web";
import { client } from "~/providers/Thirdweb";

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

  const logout = async () => {
    if (wallet) {
      void disconnect(wallet);
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
                <MediaRenderer
                  src={imageUrl}
                  alt="Profile Pic"
                  width={"48px"}
                  height={"48px"} 
                  client={client}
                />
              </div>
            </div>
            <span>{data.username}</span>
          </div>
        </div>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><a onClick={() => void logout()}>Logout</a></li>
        </ul>
      </div>
    </div>
  )
};
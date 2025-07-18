import { type FC, useState, useMemo } from "react";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { api } from "~/utils/api";
import { ProfileForm } from "~/components/Profile/Form";
import Connect from "~/components/utils/Connect";
import { useDisconnect } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import dynamic from "next/dynamic";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import SignInWithEthereum from "../utils/SignIn";
import { SignInWithFarcaster } from "../utils/SignInWithFarcaster";
import { DEFAULT_CHAIN } from "~/constants";
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
  hideLogout?: boolean;
  hideNameAndBadge?: boolean;
  label?: string;
}
export const ProfileButton: FC<Props> = ({ onProfileCreated, loginBtnLabel, createProfileBtnLabel, hideLogout, hideNameAndBadge, label }) => {
  const { data: sessionData } = useSession();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [createdProfileImgUrl, setCreatedProfileImgUrl] = useState<string>();

  const { data, isLoading, refetch } = api.profile.getByAddress.useQuery({
    chainId: DEFAULT_CHAIN.id,
    address: account?.address ?? sessionData?.user?.address ?? "",
  }, {
    enabled: !!account?.address || !!sessionData?.user?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Use sessionData for username and image if available, otherwise fall back to profile data
  const displayUsername = sessionData?.user?.username ?? data?.username;
  const displayImage = sessionData?.user?.image ?? data?.imgUrl;
  const imageUrl = displayImage?.replace("ipfs://", "https://ipfs.io/ipfs/");

  const hasNoAvatar = useMemo(() => {
    if (createdProfileImgUrl && createdProfileImgUrl !== '') return false;
    if (imageUrl && imageUrl !== '') return false;
    return true;
  }, [createdProfileImgUrl, imageUrl]);

  const logout = async () => {
    if (wallet) {
      void disconnect(wallet);
    }
    await signOut({ redirect: false });
  }

  if (!account && !sessionData?.user?.id) return (
    <div className="mr-4 flex items-center gap-2">
      <Connect loginBtnLabel={loginBtnLabel} />
      <div className="hidden md:block">
        <SignInWithFarcaster />
      </div>
    </div>
  )

  if (account && wallet?.id !== 'inApp' && !sessionData?.user?.id) {
    return (
      <SignInWithEthereum 
        btnLabel="I will play with honor"
        defaultOpen={true}
      />
    )
  }

  if (!displayUsername) return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <div className="flex items-center gap-2">
        <button className="btn" onClick={()=>(document.getElementById('create_profile_modal') as HTMLDialogElement).showModal()}>
          {createProfileBtnLabel ?? 'Profile'}
        </button>
        <button className={`btn ${hideLogout ? 'hidden' : ''}`} onClick={() => void logout()}>
          <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
        </button>
      </div>

      <dialog id="create_profile_modal" className="modal modal-bottom sm:modal-middle">
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

  const img = () => {
    if (createdProfileImgUrl && createdProfileImgUrl !== '') return createdProfileImgUrl;
    if (imageUrl && imageUrl !== '') return imageUrl;
    return '/images/logo.png';
  }

  return (
    <div className="mr-4">
      <div className="dropdown dropdown-end dropdown-top">
        <div tabIndex={0} role="button" className="btn btn-ghost">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="h-8 w-8 bg-base-200 rounded-full animate-pulse" />
                <div className="h-5 w-24 bg-base-200 rounded-lg animate-pulse" />
              </>
            ) : (
              <>
              <div className="indicator">
                {hasNoAvatar && <span className="indicator-item badge badge-accent"></span>}
                <div className="flex flex-col gap-1 items-center">
                  <CustomMediaRenderer
                    src={img()}
                    alt="Profile Pic"
                    width={"24px"}
                    height={"24px"}
                    className="rounded-full"
                    client={client}
                  />
                  {!hideNameAndBadge ? (
                    <>
                      <span className="text-sm font-normal">{displayUsername}</span>
                      {sessionData?.user?.fid && (
                        <CheckBadgeIcon className="w-4 h-4 text-primary" />
                      )}
                    </>
                  ) : (
                    label && <span className="text-sm font-normal">{label}</span>
                  )}
                </div>
              </div>
              </>
            )}
          </div>
        </div>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li>
            <Link href={`/profile/address/${data?.address ?? sessionData?.user?.address ?? ''}`}>
              Profile {hasNoAvatar && <div className="badge badge-accent">add avatar</div>}
            </Link>
          </li>
          <li><button onClick={() => void logout()}>Logout</button></li>
        </ul>
      </div>
    </div>
  )
};
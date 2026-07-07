import { type FC, useState, useMemo, useCallback } from "react";
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

const compactProfileButtonClassName =
  "!btn !btn-ghost !h-auto !min-h-0 !w-16 !flex !flex-col !items-center !justify-center !gap-0.5 !border-0 !bg-transparent !px-0 !py-1 !font-display !text-[0.65rem] !font-normal !tracking-wide !text-base-content/60 !shadow-none !normal-case hover:!bg-transparent before:content-['👤'] before:text-xl before:leading-none";

const compactProfileLinkClassName =
  "flex h-auto min-h-0 w-16 flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-0 py-1 font-display text-[0.65rem] font-normal tracking-wide text-base-content/60 shadow-none hover:bg-transparent";

const compactProfileLinkActiveClassName =
  "flex h-auto min-h-0 w-16 flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-0 py-1 font-display text-[0.65rem] font-bold tracking-wide text-primary shadow-none hover:bg-transparent";

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
  active?: boolean;
}
export const ProfileButton: FC<Props> = ({ onProfileCreated, loginBtnLabel, createProfileBtnLabel, hideLogout, hideNameAndBadge, label, active }) => {
  const { data: sessionData } = useSession();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [createdProfileImgUrl, setCreatedProfileImgUrl] = useState<string>();

  // Memoize the address to prevent unnecessary query reruns
  const queryAddress = useMemo(() => {
    return account?.address ?? sessionData?.user?.address ?? null;
  }, [account?.address, sessionData?.user?.address]);

  const { data, isLoading, refetch } = api.profile.getByAddress.useQuery({
    chainId: DEFAULT_CHAIN.id,
    address: queryAddress ?? "", // Use empty string only when queryAddress is null
  }, {
    enabled: !!queryAddress, // Only enable when we have a valid address
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

  // Memoize the img function to prevent unnecessary re-renders
  const imgSrc = useMemo(() => {
    if (createdProfileImgUrl && createdProfileImgUrl !== '') return createdProfileImgUrl;
    if (imageUrl && imageUrl !== '') return imageUrl;
    return '/images/logo.png';
  }, [createdProfileImgUrl, imageUrl]);

  const logout = useCallback(async () => {
    if (wallet) {
      void disconnect(wallet);
    }
    await signOut({ redirect: false });
  }, [wallet, disconnect]);

  // Memoize the profile saved callback to prevent unnecessary re-renders
  const handleProfileSaved = useCallback((profile: { username: string; imgUrl: string; metadata?: string }) => {
    void refetch();
    onProfileCreated?.(profile);
    setCreatedProfileImgUrl(profile.imgUrl);
  }, [refetch, onProfileCreated]);

  const isCompact = !!hideNameAndBadge;
  const compactLabel = label ?? loginBtnLabel ?? "You";

  if (!account && !sessionData?.user?.id) return (
    <div className={isCompact ? "flex items-center justify-center" : "mr-4 flex items-center gap-2"}>
      <Connect
        loginBtnLabel={isCompact ? compactLabel : loginBtnLabel}
        className={isCompact ? compactProfileButtonClassName : undefined}
      />
      {!isCompact && (
        <div className="hidden md:block">
          <SignInWithFarcaster />
        </div>
      )}
    </div>
  )

  // Handle case where user has session but no wallet connected
  // This prevents infinite refresh loops
  if (!account && sessionData?.user?.id) {
    return (
      <div className={isCompact ? "flex items-center justify-center" : "mr-4 flex items-center gap-2"}>
        <Connect
          loginBtnLabel={isCompact ? compactLabel : "Reconnect"}
          className={isCompact ? compactProfileButtonClassName : undefined}
        />
        {!hideLogout && !isCompact && (
          <button className="btn" onClick={logout}>
            <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  if (account && wallet?.id !== 'inApp' && !sessionData?.user?.id) {
    return (
      <SignInWithEthereum 
        btnLabel={isCompact ? compactLabel : "I will play with honor"}
        defaultOpen={true}
        buttonClassName={isCompact ? compactProfileButtonClassName : undefined}
      />
    )
  }

  const profileHref = `/profile/address/${queryAddress ?? ""}`;
  const compactLinkClassName = active ? compactProfileLinkActiveClassName : compactProfileLinkClassName;

  const profileAvatar = isLoading ? (
    <div className="h-6 w-6 rounded-full bg-base-200 animate-pulse" />
  ) : (
    <div className="indicator">
      {hasNoAvatar && <span className="indicator-item badge badge-accent badge-xs" />}
      <CustomMediaRenderer
        src={imgSrc}
        alt="Profile Pic"
        width={"24px"}
        height={"24px"}
        className="rounded-full"
        client={client}
      />
    </div>
  );

  if (!displayUsername) {
    if (isCompact) {
      return (
        <Link href={profileHref} className={compactLinkClassName}>
          {profileAvatar}
          <span>{compactLabel}</span>
        </Link>
      );
    }

    return (
      <>
        <div className="flex items-center gap-2">
          <button
            className="btn"
            onClick={() => (document.getElementById("create_profile_modal") as HTMLDialogElement).showModal()}
          >
            {createProfileBtnLabel ?? "Profile"}
          </button>
          {!hideLogout && (
            <button className="btn" onClick={logout}>
              <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <dialog id="create_profile_modal" className="modal modal-bottom sm:modal-middle">
          <div className="modal-box relative">
            <button
              className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4"
              onClick={() => (document.getElementById("create_profile_modal") as HTMLDialogElement).close()}
            >
              &times;
            </button>
            <h3 className="font-bold text-2xl mb-4">Create Profile</h3>
            <ProfileForm onProfileSaved={handleProfileSaved} />
          </div>
        </dialog>
      </>
    );
  }

  if (isCompact) {
    return (
      <Link href={profileHref} className={compactLinkClassName}>
        {profileAvatar}
        {label && <span>{label}</span>}
      </Link>
    );
  }

  return (
    <div className="mr-4">
      <Link href={profileHref} className="btn btn-ghost">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <>
              <div className="h-8 w-8 bg-base-200 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-base-200 rounded-lg animate-pulse" />
            </>
          ) : (
            <>
              <div className="indicator">
                {hasNoAvatar && <span className="indicator-item badge badge-accent" />}
                <CustomMediaRenderer
                  src={imgSrc}
                  alt="Profile Pic"
                  width={"24px"}
                  height={"24px"}
                  className="rounded-full"
                  client={client}
                />
              </div>
              <span className="text-sm font-normal">{displayUsername}</span>
              {sessionData?.user?.fid && (
                <CheckBadgeIcon className="w-4 h-4 text-primary" />
              )}
            </>
          )}
        </div>
      </Link>
    </div>
  );
};
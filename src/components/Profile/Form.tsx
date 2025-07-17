import { useState, type FC, useContext, useMemo } from "react";
import { useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { toast } from "react-toastify";
import dynamic from 'next/dynamic';
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { containsProfanity } from "~/utils/profanity";

const Upload = dynamic(() => import('~/components/utils/Upload'), { ssr: false });

type Props = {
  onProfileSaved?: (profile: {
    username: string;
    imgUrl: string;
    metadata?: string;
  }) => void;
  existingUsername?: string;
  existingImgUrl?: string;
}

export const ProfileForm: FC<Props> = ({ onProfileSaved, existingUsername, existingImgUrl }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { data: sessionData } = useSession();
  const wallet = useActiveWallet();
  
  // Prioritize existing values, then sessionData, then empty string
  const [imgUrl, setImgUrl] = useState<string>(existingImgUrl ?? sessionData?.user?.image ?? "");
  const [username, setUsername] = useState<string>(existingUsername ?? sessionData?.user?.username ?? "");
  const metadata = "";
  const [error, setError] = useState<string | null>(null);
  const [saveProfileBtnLabel, setSaveProfileBtnLabel] = useState<string>("Save Profile");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  
  const createProfile = api.profile.create.useMutation({
    onSuccess: () => {
      // Since we're saving to database directly, no need for transaction tracking
      onProfileSaved?.({username, imgUrl, metadata});
      setIsLoading(false);
      setSaveProfileBtnLabel("Save Profile");
      toast.success("Profile saved successfully!");
      // close the modal
      (document.getElementById('create_profile_modal') as HTMLDialogElement)?.close();
      // navigate to the profile page of the new username
      void router.push(`/profile/${username}`);
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
      setSaveProfileBtnLabel("Save Profile");
    },
  });

  const isValidUsername = useMemo(() => {
    return (
      username.length >= 3 &&
      username.length <= 20 &&
      !containsProfanity(username)
    );
  }, [username]);

  const withGateway = (url: string) => {
    return url.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${url.slice(7)}` : url;
  }

  const saveProfile = async () => {
    if (!wallet) {
      return toast.error("You must login to save your profile!");
    }
    setSaveProfileBtnLabel("Saving...");
    setIsLoading(true);
    try {
      createProfile.mutate({
        chainId: activeChain.id,
        address: wallet.getAccount()!.address,
        username,
        imgUrl,
        metadata,
      });
    } catch (error) {
      const e = error as Error;
      const errorMessage = e.message?.match(/'([^']+)'/)?.[1] ?? e.message?.split('contract:')[0]?.trim() ?? e.message;
      setError(errorMessage);
      setIsLoading(false);
      setSaveProfileBtnLabel("Save Profile");
    }
  }

  if (!wallet) return null;

  const memoInitialUrls = useMemo(() =>
    imgUrl ? [withGateway(imgUrl)] : []
  , [imgUrl]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center h-24 w-24 rounded-full">
        <Upload
          height={'h-24'}
          label="📷 avatar"
          additionalClasses="rounded-full"
          imageClassName="rounded-full"
          initialUrls={memoInitialUrls}
          onUpload={({ uris }) => {
            setImgUrl(uris[0]!);
          }}
        />
      </div>
      <input
        type="text"
        className="input input-bordered text-center"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value.replace(/[^0-9a-zA-Z-_ ]/g, '').toLowerCase());
        }}
        placeholder="username"
      />
      {!isValidUsername && (
        <span className="text-xs opacity-50 text-center px-8 sm:px-16">
          Username must be 3-20 characters, contain only lowercase letters, numbers, and hyphens, and not include profanity
        </span>
      )}
      <button
        className="btn btn-primary"
        onClick={saveProfile}
        disabled={!isValidUsername || isLoading}
      >
        {isLoading && (
          <div className="loading loading-spinner" />
        )}
        {saveProfileBtnLabel}
      </button>
      {error && (
        <div className="flex flex-col gap-1">
          <span className="text-error text-center text-xs px-8 sm:px-16">{error}</span>
        </div>
      )}

    </div>
  )
};
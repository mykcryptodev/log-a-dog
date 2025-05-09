import { useState, type FC, useContext, useMemo } from "react";
import { useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { toast } from "react-toastify";
import dynamic from 'next/dynamic';
import { api } from "~/utils/api";
import { TransactionStatus } from "~/components/utils/TransactionStatus";
import { router } from "node_modules/@trpc/server/dist/deprecated/router";
import { useRouter } from "next/router";

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
  const wallet = useActiveWallet();
  const [imgUrl, setImgUrl] = useState<string>(existingImgUrl ?? "");
  const [username, setUsername] = useState<string>(existingUsername ?? "");
  const metadata = "";
  const [error, setError] = useState<string | null>(null);
  const [saveProfileBtnLabel, setSaveProfileBtnLabel] = useState<string>("Save Profile");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [queueId, setQueueId] = useState<string | null>(null);
  const router = useRouter();
  
  const createProfile = api.profile.create.useMutation({
    onSuccess: (data) => {
      setQueueId(data);
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
    return username.length >= 3 && username.length <= 20;
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

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center h-24 w-24 rounded-full">
        <Upload
          height={'h-24'}
          label="📷 avatar"
          additionalClasses="rounded-full"
          imageClassName="rounded-full"
          initialUrls={imgUrl ? [withGateway(imgUrl)] : []}
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
          Username must be 3-20 characters and only contain lowercase letters, numbers, and hyphens
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
      {queueId && (
        <TransactionStatus
          queueId={queueId}
          loadingMessages={[
            { message: "Brightening your teeth..."},
            { message: "Wiping away mustard stains..."},
            { message: "Ok, you look better now..."},
            { message: "Saving your profile..." },
          ]}
          successMessage="Profile saved successfully!"
          errorMessage="Failed to save profile"
          onResolved={(success) => {
            if (success) {
              onProfileSaved?.({username, imgUrl, metadata});
            }
            setQueueId(null);
            setIsLoading(false);
            setSaveProfileBtnLabel("Save Profile");
          }}
        />
      )}
    </div>
  )
};
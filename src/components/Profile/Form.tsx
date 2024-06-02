import { useState, type FC, useContext, useMemo } from "react";
import { useActiveWallet } from "thirdweb/react";
import { getContract, sendTransaction } from "thirdweb";
import ActiveChainContext from "~/contexts/ActiveChain";
import { PROFILES } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { toast } from "react-toastify";
import dynamic from 'next/dynamic';
import { setProfile } from "~/thirdweb/8453/0x2da5e4bba4e18f9a8f985651a846f64129459849";
import { sendCalls, useCapabilities } from "thirdweb/wallets/eip5792";

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
  const { data: walletCapabilities } = useCapabilities();
  const [imgUrl, setImgUrl] = useState<string>(existingImgUrl ?? "");
  const [username, setUsername] = useState<string>(existingUsername ?? "");
  const metadata = "";
  const [error, setError] = useState<string | null>(null);
  const [saveProfileBtnLabel, setSaveProfileBtnLabel] = useState<string>("Save Profile");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const contract = getContract({
    client,
    address: PROFILES[activeChain.id]!,
    chain: activeChain,
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
    const transaction = setProfile({
      contract,
      username,
      image: imgUrl,
      metadata: ""
    });
    setSaveProfileBtnLabel("Saving...");
    setIsLoading(true);
    try {
      const chainIdAsHex = activeChain.id.toString(16) as unknown as number;
      if (walletCapabilities?.[chainIdAsHex]) {
        await sendCalls({
          chain: activeChain,
          wallet,
          calls: [transaction],
          capabilities: {
            paymasterService: {
              url: `https://${activeChain.id}.bundler.thirdweb.com/${client.clientId}`
            }
          },
        });
      } else {
        await sendTransaction({
          account: wallet.getAccount()!,
          transaction,
        });
      }
      toast.success("Profile saved");
      // give the blockchain some time to index the transaction
      setTimeout(() => {
        onProfileSaved?.({username, imgUrl, metadata});
      }, 3000);
    } catch (error) {
      const e = error as Error;
      const errorMessage = e.message?.match(/'([^']+)'/)?.[1] ?? e.message?.split('contract:')[0]?.trim() ?? e.message;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setSaveProfileBtnLabel("Save Profile");
      // close modal
      (document.getElementById('create_profile_modal') as HTMLDialogElement)?.close();
    }
  }

  if (!wallet) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center h-24 w-24 rounded-full">
        <Upload
          height={'h-24'}
          label="📷"
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
    </div>
  )
};
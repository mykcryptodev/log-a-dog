import { useState, type FC, useContext, useMemo } from "react";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import Upload from "~/components/utils/Upload";
import ActiveChainContext from "~/contexts/ActiveChain";
import { PROFILES } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { toast } from "react-toastify";
import { MAX_PRIORITY_FEE_PER_GAS } from "~/constants/chains";

type Props = {
  onProfileCreated?: (profile: {
    username: string;
    imgUrl: string;
    metadata?: string;
  }) => void;
}

export const ProfileForm: FC<Props> = ({ onProfileCreated }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const account = useActiveAccount();
  const [imgUrl, setImgUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const metadata = "";
  const [error, setError] = useState<string | null>(null);
  const [saveProfileBtnLabel, setSaveProfileBtnLabel] = useState<string>("Save Profile");

  const contract = getContract({
    client,
    address: PROFILES[activeChain.id]!,
    chain: activeChain,
  });

  const tx = prepareContractCall({
    contract,
    method: "function setProfile(string username, string imgUrl, string metadata)",
    params: [username, imgUrl, ""],
    // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS[activeChain.id],
  });

  const isValidUsername = useMemo(() => {
    return username.length >= 3 && username.length <= 20;
  }, [username]);

  if (!account) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center h-24 w-24 rounded-full">
        <Upload
          height={'h-24'}
          label="📷"
          additionalClasses="rounded-full"
          imageClassName="rounded-full"
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
      <TransactionButton
        waitForReceipt
        style={!isValidUsername ? {
          pointerEvents: 'none',
          color: 'rgb(0, 0, 0, 0.5)',
        } : {}}
        transaction={() => tx}
        onSubmitted={() => {
          setSaveProfileBtnLabel("Saving...");
        }}
        onReceipt={(receipt) => {
          console.log({ receipt });
          toast.dismiss();
          toast.success("Profile saved");
          onProfileCreated?.({username, imgUrl, metadata});
          setSaveProfileBtnLabel("Save Profile");
          // close modal
          (document.getElementById('create_profile_modal') as HTMLDialogElement).close();
        }}
        onError={(e) => {
          console.log({ e });
          const errorMessage = e.message?.match(/'([^']+)'/)?.[1] ?? e.message?.split('contract:')[0]?.trim() ?? e.message;
          setError(errorMessage);
          setSaveProfileBtnLabel("Save Profile");
        }}
      >
        {saveProfileBtnLabel}
      </TransactionButton>
      {error && (
        <span className="text-error text-center text-xs px-8 sm:px-16">{error}</span>
      )}
    </div>
  )
};
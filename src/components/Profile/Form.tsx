import { useState, type FC, useContext } from "react";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import Upload from "~/components/utils/Upload";
import ActiveChainContext from "~/contexts/ActiveChain";
import { PROFILES } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { toast } from "react-toastify";

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

  const contract = getContract({
    client,
    address: PROFILES[activeChain.id]!,
    chain: activeChain,
  });

  const tx = prepareContractCall({
    contract,
    method: "function setProfile(string username, string imgUrl, string metadata)",
    params: [username, imgUrl, ""],
  });

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
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
      />
      <TransactionButton
        transaction={() => tx}
        onSubmitted={() => {
          toast.info("Saving...");
          onProfileCreated?.({username, imgUrl, metadata});
        }}
        onReceipt={() => toast.success("Profile saved")}
        onError={(e) => toast.error(e.message) }
      >
        Save Profile
      </TransactionButton>
    </div>
  )
};
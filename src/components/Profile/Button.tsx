import { useContext, type FC } from "react";
import { useActiveAccount } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";

export const ProfileButton: FC = () => {
  const { activeChain } = useContext(ActiveChainContext);
  const account = useActiveAccount();
  const { data } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  console.log({ data })

  if (!data) return null;

  const imageUrl = data.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (
    <button className="btn btn-ghost">
      <div className="flex items-center gap-2">
        <div className="avatar">
          <div className="w-8 rounded-full">
            <Image
              src={imageUrl}
              alt="profile"
              width={48}
              height={48}
            />
          </div>
        </div>
        <span>{data.username}</span>
      </div>
    </button>
  )
};
import { useContext, type FC } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";
import { ProfileForm } from "~/components/Profile/Form";

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

  if (!account) return (
    <ConnectButton 
      connectButton={{
        label: "Login"
      }}
    />
  )

  if (!data?.username) return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button className="btn" onClick={()=>(document.getElementById('create_profile_modal') as HTMLDialogElement).showModal()}>
        Create Profile
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
          <ProfileForm />
        </div>
      </dialog>
    </>
  );

  const imageUrl = data.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (
    <ConnectButton
      detailsButton={{
        render: () => (
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
      }}
      connectButton={{
        label: "Login"
      }}
    />
  )
};
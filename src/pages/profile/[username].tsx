import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useContext, useMemo, useState } from "react";
import { ProfileForm } from "~/components/Profile/Form";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import dynamic from "next/dynamic";
import { client } from "~/providers/Thirdweb";
import { CreateAttestation } from "~/components/Attestation/Create";
import { useActiveAccount } from "thirdweb/react";
import { UserListAttestations } from "~/components/Attestation/UserList";

const CustomMediaRenderer = dynamic(
  () => import('~/components/utils/CustomMediaRenderer'),
  { ssr: false }
);
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { username } = context.params as { username: string };
  return {
    props: {
      username,
    },
  };
};

export const Profile: NextPage<{ username: string }> = ({ username }) => {
  const acccount = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const { data, isLoading, refetch } = api.profile.getByUsername.useQuery({
    username,
    chainId: activeChain.id,
  }, {
    enabled: !!username,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  console.log({ data });
  const [refetchTimestamp, setRefetchTimestamp] = useState<number>(0);
  const [showProfileForm, setShowProfileForm] = useState<boolean>(false);

  const isOwnProfile = useMemo(() => {
    return acccount?.address.toLowerCase() === data?.address.toLowerCase();
  }, [acccount, data]);

  if (isLoading) return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">
            <div className="loading loading-spinner mr-2" />
            Loading...
          </h1>
        </div>
      </div>
    </main>
  )

  if (!data) return null;
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <CustomMediaRenderer
                src={data.imgUrl ?? ""}
                alt={data.username}
                className="rounded-full"
                width={"48px"}
                height={"48px"}
                client={client}
              />
              <h1 className="text-2xl font-bold">{data?.username}</h1>
            </div>
            <button className={`btn btn-ghost btn-xs ${isOwnProfile ? '' : 'hidden'}`} onClick={() => setShowProfileForm(!showProfileForm)}>
              {showProfileForm ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
          {showProfileForm && (
            <ProfileForm
              onProfileSaved={() => {
                void refetch();
                setShowProfileForm(false);
              }}
              existingImgUrl={data?.imgUrl}
              existingUsername={data?.username}
            />
          )}
          {isOwnProfile && (
            <CreateAttestation onAttestationCreated={() => setRefetchTimestamp(new Date().getTime())} />
          )}
          <UserListAttestations
            refetchTimestamp={refetchTimestamp}
            limit={4}
            user={data.address}
          />
        </div>
      </div>
    </main>
  );
};

export default Profile;
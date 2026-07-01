import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import { ProfileForm } from "~/components/Profile/Form";
import { api } from "~/utils/api";
import dynamic from "next/dynamic";
import { client } from "~/providers/Thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { UserListAttestations } from "~/components/Attestation/UserList";
import { useSession } from "next-auth/react";
import { DEFAULT_CHAIN } from "~/constants";
import { Seo, SITE_URL } from "~/components/utils/Seo";

const CustomMediaRenderer = dynamic(
  () => import('~/components/utils/CustomMediaRenderer'),
  { ssr: false }
);
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { username } = context.params as { username: string };

  if (/^0x[a-fA-F0-9]{40}$/.test(username)) {
    return {
      redirect: {
        destination: `/profile/address/${username}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      username,
    },
  };
};

export const Profile: NextPage<{ username: string }> = ({ username }) => {
  const acccount = useActiveAccount();
  const { data: sessionData } = useSession();
  const { data, isLoading, refetch } = api.profile.getByUsername.useQuery({
    username,
    chainId: DEFAULT_CHAIN.id,
  }, {
    enabled: !!username,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const [showProfileForm, setShowProfileForm] = useState<boolean>(false);

  // `username` comes from getServerSideProps, so this metadata is present in the
  // SSR HTML that crawlers read (the profile data itself is fetched client-side).
  const seo = (
    <Seo
      title={`@${username} on Log a Dog`}
      exactTitle
      description={`See how many hotdogs @${username} has logged onchain — then log your own and climb the leaderboard.`}
      url={`${SITE_URL}/profile/${username}`}
      type="profile"
    />
  );

  // Check if this is the user's own profile
  const isOwnProfile = useMemo(() => {
    return acccount?.address.toLowerCase() === data?.address.toLowerCase() ||
           sessionData?.user?.address?.toLowerCase() === data?.address.toLowerCase();
  }, [acccount, sessionData, data]);

  // Only use sessionData for display if this is the user's own profile AND sessionData has the info
  const displayUsername = (isOwnProfile && sessionData?.user?.username) ? sessionData.user.username : data?.username;
  const displayImage = (isOwnProfile && sessionData?.user?.image) ? sessionData.user.image : data?.imgUrl;

  if (isLoading) return (
    <>
      {seo}
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
    </>
  )

  if (!data) return seo;
  return (
    <>
    {seo}
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <div className="pop-card mb-8 flex items-center justify-between gap-3 rounded-2xl bg-base-100 p-4">
            <div className="flex items-center gap-4">
              <span className="pop-frame inline-flex overflow-hidden rounded-full">
                <CustomMediaRenderer
                  src={displayImage ?? ""}
                  alt={displayUsername ?? ""}
                  className="rounded-full"
                  width={"48px"}
                  height={"48px"}
                  client={client}
                />
              </span>
              <h1 className="font-display text-2xl tracking-wide">{displayUsername}</h1>
            </div>
            <button className={`pop-btn rounded-lg bg-base-100 px-3 py-1 font-display text-xs ${isOwnProfile ? '' : 'hidden'}`} onClick={() => setShowProfileForm(!showProfileForm)}>
              {showProfileForm ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
          {showProfileForm && (
            <ProfileForm
              onProfileSaved={() => {
                void refetch();
                setShowProfileForm(false);
              }}
              existingImgUrl={displayImage}
              existingUsername={displayUsername}
            />
          )}
          <UserListAttestations
            limit={4}
            user={data.address}
          />
        </div>
      </div>
    </main>
    </>
  );
};

export default Profile;
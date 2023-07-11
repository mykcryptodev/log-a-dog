import { ArrowLeftIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { MediaRenderer } from "@thirdweb-dev/react";
import { type GetServerSideProps, type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type FC, useMemo,useState } from "react";

import ProfileDetailsForm from "~/components/Profile/Form/Details";
import ProfileGraphicsForm from "~/components/Profile/Form/Graphics";
import ProfileLinksForm from "~/components/Profile/Form/Links";
import Name from "~/components/Profile/Name";
import SignInButton from "~/components/utils/SignIn";
import { api } from "~/utils/api";

interface Props {
  addressOrName: string;
  action?: string | null;
}

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const addressOrName = query.id as string;
  const action = query.action as string | null | undefined;

  return {
    props: {
      addressOrName,
      action: action || null
    }
  };
};

export const EditProfile: NextPage<Props> = ({
  addressOrName,
  action
}) => {
  const { data: session } = useSession();
  const [activeItem, setActiveItem] = useState<string>(action || "details");
  const { data: profile, isLoading, refetch } = api.profile.getByAddressOrName.useQuery(addressOrName);
  const isProfileOwnerOrAdmin = useMemo(() => {
    if (!session?.user) return false;
    if (session.user.isAdmin) return true;
    if (addressOrName.toLowerCase() === session?.user?.address?.toLowerCase()) return true;
    return false;
  }, [addressOrName, session?.user]);

  if (!isProfileOwnerOrAdmin && !isLoading) return (
    <div className="min-h-screen min-w-screen h-full w-full backdrop-blur text-center">
      <div className="flex flex-col gap-4 w-full justify-center items-center">
        <ShieldExclamationIcon className="w-20 h-20 stroke-2" />
        <span className="text-5xl font-bold">
          Restricted Area
        </span>
        <span className="text-xl">
          You must be the user who owns this profile in order to edit it.
        </span>
        <div className="mx-auto">
          <SignInButton className="btn btn-lg btn-primary" />
        </div>
        <Link href={`/profile/${addressOrName}`} className="btn btn-ghost">
          <ArrowLeftIcon className="w-6 h-6 stroke-2" />
          Back to profile
        </Link>
      </div>
    </div>
  )

  const closeDrawerIfOpen = () => {
    const drawer = document.getElementById("profile-settings-drawer") as HTMLInputElement;
    if (drawer?.checked) {
      drawer?.click();
    }
  }

  const Menu: FC = () => {    
    const profileSettings = [
      "details",
      "links",
      "graphics",
    ];

    return (
      <ul className="menu p-4 w-80 min-h-full lg:bg-base-100 bg-base-200">
        <div className="lg:hidden flex text-2xl font-bold py-10">Edit Profile</div>
        <Link href={`/profile/${addressOrName}`} className="mb-8 flex flex-col gap-2">
          {profile?.img?.startsWith("ipfs://") ? (
            <MediaRenderer
              src={profile?.img}
              className="w-32 h-32 rounded-lg object-cover"
              style={{ objectFit: "cover", width: "8rem", height: "8rem" }}
            />
          ) : (
            <Image
              src={profile?.img || "/images/default-logo.png"}
              width={128}
              height={128}
              className="w-32 h-32 rounded-lg object-cover"
              alt="Profile Image"
            />
          )}
          <div className="font-bold text-lg w-full">
            <Name address={addressOrName} className="font-bold text-lg w-full" />
          </div>
        </Link>
        <li className="menu-title">Profile Settings</li>
        {profileSettings.map((setting) => (
          <li key={setting}>
            <a 
              className={`capitalize ${activeItem === setting ? "active" : ""}`}
              onClick={() => {
                setActiveItem(setting);
                closeDrawerIfOpen();
              }}
            >
              {setting}
            </a>
          </li>
        ))}
      </ul>
    )
  }

  if (isLoading) return (
    <div className="w-full flex gap-2">
      <div className="h-screen w-full lg:w-3/12 bg-base-200 animate-pulse rounded-lg" />
      <div className="lg:flex hidden h-screen w-9/12 bg-base-200 animate-pulse rounded-lg" />
    </div>
  );

  return (
    <div className="drawer">
      <input id="profile-settings-drawer" type="checkbox" className="drawer-toggle" /> 
      <div className="drawer-content flex flex-col">
        <div className="flex w-full gap-8">
          <div className="lg:flex hidden">
            <Menu />
          </div>
          <div className="w-full max-w-xl mx-auto px-2">
            <div className="text-2xl font-bold py-10 flex items-center gap-2">
              <label htmlFor="profile-settings-drawer" className="btn btn-square btn-ghost lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </label>
              Edit Profile
            </div>
            {activeItem === "details" && (
              <ProfileDetailsForm profile={profile} />
            )}
            {activeItem === "links" && (
              <ProfileLinksForm profile={profile} />
            )}
            {activeItem === "graphics" && (
              <ProfileGraphicsForm profile={profile} onSave={() => void refetch()} />
            )}
          </div>
        </div>
      </div>
      <div className="drawer-side z-20">
        <label htmlFor="profile-settings-drawer" className="drawer-overlay"></label> 
        <Menu />
      </div>
    </div>
  );
}

export default EditProfile;
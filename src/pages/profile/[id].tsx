import { EllipsisHorizontalCircleIcon, FlagIcon, PencilIcon } from "@heroicons/react/24/outline";
import { MediaRenderer, useAddress } from "@thirdweb-dev/react";
import { isAddress } from "ethers/lib/utils";
import { type GetServerSideProps, type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { type FC, useEffect, useMemo, useState } from "react";

import CensoredContent from "~/components/Report/CensoredContent";
import CreateReport from "~/components/Report/Create";
import DiscordIcon from "~/components/utils/icons/Discord";
import BlockchainExplorerIcon from "~/components/utils/icons/Etherscan";
import TwitterIcon from "~/components/utils/icons/Twitter";
import useContentIsCensored from "~/hooks/useContentIsCensored";
import useShortenedAddress from "~/hooks/useShortenedAddress";
import { api } from "~/utils/api";

interface Props {
  addressOrName: string;
}

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const addressOrName = query.id as string;
  return {
    props: {
      addressOrName
    }
  };
};

export const Profile: NextPage<Props> = ({ addressOrName }) => {
  const { data: session } = useSession();
  const router = useRouter();
  // check if the url is an address or name
  const addressIsInUrl = isAddress(addressOrName);
  const nameIsInUrl = useMemo(() => {
    return !addressIsInUrl;
  }, [addressIsInUrl]);
  const address = useMemo(() => {
    if (addressIsInUrl) return addressOrName;
    return undefined;
  }, [addressIsInUrl, addressOrName]);
  const name = useMemo(() => {
    if (nameIsInUrl && addressOrName) {
      // replace the underscores in addressOrName with spaces
      return addressOrName.replace(/_/g, " ");
    }
    return undefined;
  }, [nameIsInUrl, addressOrName]);
  const { data: profile, isLoading: profileIsLoading } = api.profile.getByAddressOrName.useQuery(
    address || name || ""
  );
  // update the url of the page to the name if it exists
  useEffect(() => {
    if (profile?.name && !nameIsInUrl) {
      const url = `/profile/${profile?.name.replace(/ /g, "_")}`;
      if (url.toLowerCase() !== router.asPath.toLowerCase()) {
        void router.push({
          pathname: url,
        }, undefined, {
          shallow: true
        });
      }
    }
  }, [addressOrName, name, nameIsInUrl, profile?.name, router, router.pathname]);
  const { data: isCensored, isLoading: isCensoredIsLoading } = useContentIsCensored(profile?.id || "", "profile");
  const [proceedToCensoredContent, setProceedToCensoredContent] = useState<boolean>(false);
  const { shortenedAddress } = useShortenedAddress(address);
  const connectedAddress = useAddress();
  const isUserProfile = 
    connectedAddress?.toLowerCase() === profile?.userId.toLowerCase() || 
    connectedAddress?.toLowerCase() === address?.toLowerCase();

  const tabs = ["Liked"];
  const [activeTab, setActiveTab] = useState<string>("Collected");

  if (profileIsLoading || isCensoredIsLoading) return (
    <div className="flex flex-col gap-2">
      <div className="w-full h-96 bg-base-200 animate-pulse rounded-none xl:rounded-lg" />
      <div className="grid grid-cols-12 mx-2 relative bottom-20">
        <div className="col-span-0 lg:col-span-1" />
        <div className="col-span-12 lg:col-span-10">
          <div className="flex justify-between items-end">
            <div className="w-48 h-48 mx-auto lg:mx-0 -top-20 bg-base-200 animate-pulse rounded-lg" />
          </div>
          <div className="h-16 lg:w-2/6 w-4/6 rounded-lg text-lg flex lg:mx-0 mx-auto my-4 bg-base-200 animate-pulse" />
          <div className="h-6 w-3/6 rounded-lg text-lg lg:mx-0 mx-auto my-4 bg-base-200 animate-pulse" />
          <div className="h-6 w-5/6 rounded-lg text-lg lg:mx-0 mx-auto text-center my-4 bg-base-200 animate-pulse" />
          <div className="h-6 w-4/6 rounded-lg text-lg lg:mx-0 mx-auto text-center my-4 bg-base-200 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (isCensored && !proceedToCensoredContent && profile) {
    return <CensoredContent profile={profile} onProceed={() => setProceedToCensoredContent(true)} />
  }

  const Links: FC<{ className?: string }> = ({ className }) => (
    <div className={className || "items-center gap-6 flex"}>
      <Link href={`https://etherscan.io/address/${profile?.userId || addressOrName}`} className="flex items-center gap-2">
        <BlockchainExplorerIcon height="32" width="32" />
      </Link>
      {profile?.twitter && (
        <Link href={`https://twitter.com/${profile?.twitter}`} className="flex items-center gap-2">
          <TwitterIcon height="32" width="32" />
        </Link>
      )}
      {profile?.discord && (
        <Link href={`https://discord.gg/${profile?.discord}`} className="flex items-center gap-2">
          <DiscordIcon height="42" width="42" />
        </Link>
      )}
      <div className="dropdown z-10">
        <label tabIndex={0} className="cursor-pointer">
          <EllipsisHorizontalCircleIcon className="h-10 w-10 stroke-2" />
        </label>
        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box text-lg font-bold">
          {(isUserProfile || session?.user.isAdmin) && (
            <li>
              <Link href={`/profile/${profile?.userId || addressOrName}/edit`} className="flex items-center gap-2">
                <PencilIcon className="w-5 h-5 stroke-2" />
                <span>Edit</span>
              </Link>
            </li>
          )}
          {profile && (
            <li>
              <CreateReport profile={profile} className="flex items-center gap-2">
                <FlagIcon className="w-5 h-5 stroke-2" /> Report
              </CreateReport>
            </li>
          )}
        </ul>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-2 relative">
      {profile?.banner?.startsWith("ipfs://") ? (
        <MediaRenderer
          src={profile?.banner}
          className="w-full aspect-video object-cover rounded-none xl:rounded-lg"
          style={{ objectFit: "cover", width: "100%", height: "auto", maxHeight: "24rem", aspectRatio: "16/9" }}
        />
      ) : (
        <Image
          src={profile?.banner || "/images/default-banner.avif"}
          width={1200}
          height={400}
          className="w-full aspect-video max-h-96 object-cover rounded-none xl:rounded-lg"
          alt="Banner Image"
        />
      )}
      <div className="grid grid-cols-12 mx-2 relative bottom-20">
        <div className="col-span-0 lg:col-span-1" />
        <div className="col-span-12 lg:col-span-10">
          <div className="flex justify-between items-end">
            <div className="w-48 h-48 mx-auto lg:mx-0 -top-20">
              {profile?.img?.startsWith("ipfs://") ? (
                <MediaRenderer
                  src={profile?.img}
                  className="w-full h-96 rounded-lg object-cover"
                  style={{ objectFit: "cover", width: "100%", height: "12rem" }}
                />
              ) : (
                <Image
                  src={profile?.img || "/images/default-logo.png"}
                  width={1200}
                  height={400}
                  className="w-full rounded-lg object-cover"
                  alt="Logo Image"
                />
              )}
            </div>
            <Links className="lg:flex hidden gap-6" />
          </div>
          <div className="relative w-full rounded-lg text-6xl font-bold lg:text-start text-center my-4">
            {profile?.name || shortenedAddress}
          </div>
          <div className="relative w-full rounded-lg text-lg lg:text-start text-center my-4">
            {profile?.bio || ""}
          </div>
          <Links className="lg:hidden flex w-full justify-center gap-6 my-6" />
        </div>
      </div>
      <div className="grid grid-cols-12 mx-2 relative bottom-20">
        <div className="col-span-0 lg:col-span-1" />
        <div className="col-span-12 lg:col-span-5">
          <div className="w-full flex justify-center lg:justify-normal">
            <div className="tabs flex flex-nowrap overflow-x-auto sm:my-0 my-4">
              {tabs.map((tab) => (
                <a
                  key={tab}
                  className={`tab sm:tab-lg tab-sm tab-bordered whitespace-nowrap ${activeTab === tab ? "tab-active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-0 lg:col-span-1" />
      </div>
    </div>
  );
};

export default Profile;
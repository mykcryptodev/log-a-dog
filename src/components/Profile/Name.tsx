import { type Profile } from "@prisma/client";
import { ethers } from "ethers";
import { type FC } from "react";

import useEnsName from "~/hooks/useEnsName";
import useShortenedAddress from "~/hooks/useShortenedAddress";
import { api } from "~/utils/api";

interface NameProps {
  address: string | undefined;
  profile?: Profile | null | undefined;
  className?: string;
  shorten?: boolean;
}

export const Name: FC<NameProps> = ({ address, profile, className, shorten }: NameProps) => {
  const { data: ensName } = useEnsName(address || "");
  const { data: fetchedProfile, isLoading: profileIsLoading } = api.profile.get.useQuery({ 
    userId: address?.toLowerCase() || "" 
  });
  profile = profile || fetchedProfile;
  const { getShortenedAddress } = useShortenedAddress();

  // handle the special case where this is the null address
  if (address === ethers.constants.AddressZero) {
    return (
      <div className="tooltip" data-tip={getShortenedAddress(address)}>
        <span>Null Address</span>
      </div>
    );
  }

  if (profileIsLoading) {
    return (
      <div className="h-6 w-24 bg-base-300 animate-pulse rounded-lg" />
    )
  }

  if (profile && profile.name) {
    return (
      <div 
        className={`tooltip ${shorten ? 'overflow-hidden overflow-ellipsis whitespace-nowrap sm:w-fit w-20 max-w-[168px]' : ''}`} 
        data-tip={getShortenedAddress(address)}
      >
        <span className={className || ""}>{profile.name}</span>
      </div>
    )
  }

  if (ensName) {
    return (
      <div 
        className={`tooltip ${shorten ? 'overflow-hidden overflow-ellipsis whitespace-nowrap sm:w-fit w-20 max-w-[168px]' : ''}`} 
        data-tip={getShortenedAddress(address)}
      >
        <span className={className || ""}>{ensName}</span>
      </div>
    )
  }

  return (
    <span className={className || ""}>{getShortenedAddress(address)}</span>
  )
}

export default Name;
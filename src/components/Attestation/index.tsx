import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";

type Props = {
  attestationId: string;
}
export const Attestation: FC<Props> = ({ attestationId }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { data: attestation } = api.attestation.getById.useQuery({
    attestationId,
    chainId: activeChain.id,
  }, {
    enabled: !!attestationId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: profile } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: attestation?.decodedAttestaton.address ?? "",
  }, {
    enabled: !!attestation,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (!attestation) return null;

  console.log({ attestation })

  // turn the ipfs:// uri into a gateway uri
  const imgUri = attestation.decodedAttestaton.imgUri.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (
    <div className="flex flex-col gap-2 bg-opacity-50 bg-base-200 rounded-lg p-4 h-fit">
      <div className="flex items-center gap-1">
        {profile?.imgUrl && (
          <Image
            src={profile.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/")}
            alt="profile"
            width={24}
            height={24}
            className="rounded-full"
          />
        )}
        <span>{profile?.username ?? attestation.decodedAttestaton.address}</span>
      </div>
      <Image
        src={imgUri}
        alt="hotdog"
        width={250}
        height={250}
        className="rounded-lg w-full"
      />
      <caption>
      </caption>
    </div>
  )
};
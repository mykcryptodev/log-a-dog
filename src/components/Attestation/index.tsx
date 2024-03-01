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

  // turn the ipfs:// uri into a gateway uri
  const imgUri = attestation.decodedAttestaton.imgUri.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (
    <div className="flex items-start gap-2">
      <Image
        src={imgUri}
        alt="hotdog"
        width={100}
        height={100}
        className="rounded-lg"
      />
      <div>
        <div>{profile?.username ?? attestation.decodedAttestaton.address}</div>
        <div>Hotdogs Eaten: {attestation.decodedAttestaton.numHotdogs.toString()}</div>
        <div>Metadata: {attestation.decodedAttestaton.metadata}</div>
      </div>
    </div>
  )
};
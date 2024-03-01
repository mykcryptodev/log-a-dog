import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";

type Props = {
  attestationId: string;
}
export const Attestation: FC<Props> = ({ attestationId }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { data } = api.attestation.getById.useQuery({
    attestationId,
    chainId: activeChain.id,
  }, {
    enabled: !!attestationId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  console.log({ data });

  if (!data) return null;

  // turn the ipfs:// uri into a gateway uri
  const imgUri = data.decodedAttestaton.imgUri.replace("ipfs://", "https://ipfs.io/ipfs/");

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
        <div>Address: {data.decodedAttestaton.address}</div>
        <div>Number of Hotdogs: {data.decodedAttestaton.numHotdogs.toString()}</div>
        <div>Metadata: {data.decodedAttestaton.metadata}</div>
      </div>
    </div>
  )
};
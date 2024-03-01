import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { MediaRenderer } from "@thirdweb-dev/react";

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

  return (
    <div className="flex items-start gap-2">
      <MediaRenderer
        src={data.decodedAttestaton.imgUri}
        height="200px"
        width="200px"
        style={{ borderRadius: '8px' }}
      />
      <div>
        <div>Address: {data.decodedAttestaton.address}</div>
        <div>Number of Hotdogs: {data.decodedAttestaton.numHotdogs.toString()}</div>
        <div>Metadata: {data.decodedAttestaton.metadata}</div>
      </div>
    </div>
  )
};
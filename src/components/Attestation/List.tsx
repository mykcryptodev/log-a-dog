import { useContext, type FC } from "react";
import { EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { Attestation } from "~/components/Attestation";

export const ListAttestations: FC = () => {
  const { activeChain } = useContext(ActiveChainContext);
  const schemaId = EAS_SCHEMA_ID[activeChain.id]!;
  const { data } = api.attestation.getBySchemaId.useQuery({
    schemaId,
    chainId: activeChain.id,
    cursor: 0,
    itemsPerPage: 10,
  }, {
    enabled: !!schemaId && !!activeChain.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  console.log({ data });
  return (
    <div className="flex flex-col items-center gap-2">
      {data?.attestations.map((attestation) => (
        <Attestation key={attestation.id} attestationId={attestation.id} />
      ))}
    </div>
  );
};
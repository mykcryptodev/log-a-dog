import { useContext, type FC } from "react";
import { EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { Attestation } from "~/components/Attestation";

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
}

export const ListAttestations: FC<Props> = ({ attestors, startDate, endDate }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const schemaId = EAS_SCHEMA_ID[activeChain.id]!;
  const { data } = api.attestation.getBySchemaId.useQuery({
    schemaId,
    chainId: activeChain.id,
    ...attestors && { attestors },
    ...startDate && { startDate: Math.floor(startDate.getTime() / 1000) },
    ...endDate && { endDate: Math.floor(endDate.getTime() / 1000) },
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
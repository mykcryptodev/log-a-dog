import { useContext, type FC, useEffect } from "react";
import { EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { Attestation } from "~/components/Attestation";

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp?: number;
}

export const ListAttestations: FC<Props> = ({ attestors, startDate, endDate, refetchTimestamp }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const schemaId = EAS_SCHEMA_ID[activeChain.id]!;
  const { data, refetch } = api.attestation.getBySchemaId.useQuery({
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
  useEffect(() => {
    if (refetchTimestamp) {
      // wait 5 seconds for the graph to index the blockchain event
      setTimeout(() => {
        void refetch();
      }, 5000);
    }
  }, [refetch, refetchTimestamp]);
  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
      {data?.attestations.map((attestation) => (
        <Attestation 
          key={attestation.id} 
          attestationId={attestation.id} 
          onAttestationRevoked={() => {
            // wait 5 seconds for the graph to index the blockchain event
            setTimeout(() => {
              void refetch();
            }, 5000);
          }}
        />
      ))}
    </div>
  );
};
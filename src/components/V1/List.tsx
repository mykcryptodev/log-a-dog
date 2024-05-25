import { useContext, useState, useEffect, type FC } from "react";
import { EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { Attestation } from "~/components/V1/Attestation";

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp?: number;
};

type AttestationT = {
  id: string;
  attester: string;
  timeCreated: number;
  decodedDataJson: string; 
}

export const ListAttestations: FC<Props> = ({ attestors, startDate, endDate, refetchTimestamp }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const schemaId = EAS_SCHEMA_ID[activeChain.id]!;
  const [attestations, setAttestations] = useState<AttestationT[]>([]);
  const [cursor, setCursor] = useState<string>();
  const { data, refetch, isLoading } = api.attestation.getBySchemaId.useQuery({
    schemaId,
    chainId: activeChain.id,
    ...attestors && { attestors },
    ...startDate && { startDate: Math.floor(startDate.getTime() / 1000) },
    ...endDate && { endDate: Math.floor(endDate.getTime() / 1000) },
    itemsPerPage: 4,
    cursor,
  }, {
    enabled: !!schemaId && !!activeChain.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const hasNextPage = (data?.total ?? 0) > attestations.length;

  useEffect(() => {
    if (!cursor) {
      setAttestations([]);
      setAttestations(data?.attestations ?? []);
    }
    if (data?.attestations && cursor) {
      setAttestations(prev => [...prev, ...data.attestations]);
    }
  }, [cursor, data?.attestations]);

  useEffect(() => {
    if (refetchTimestamp) {
      setCursor(undefined);
      void refetch();
    }
  }, [refetch, refetchTimestamp]);

  const loadMore = () => {
    if (hasNextPage && !isLoading) {
      setCursor(attestations[attestations.length - 1]?.id);
    }
  };

  type AttestationWrapperProps = {
    attestation: AttestationT;
  }
  const AttestationWrapper = (props: AttestationWrapperProps) => {
    return (
      <div>
        <Attestation 
          attestationId={props.attestation.id} 
          refreshAttestations={() => {
            // wait 5 seconds for the blockchain
            setTimeout(() => {
              setCursor(undefined);
              void refetch();
            }, 5000);
          }}
          onAttestationRevoked={(attestationId) => {
            setAttestations(prev => prev.filter(att => att.id !== attestationId));
          }}
        />
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
      {attestations.map((attestation, index) => (
        <AttestationWrapper 
          key={index} 
          attestation={attestation} 
        />
      ))}
      {(isLoading && attestations.length === 0) ? Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="animate-pulse bg-base-200 rounded-lg h-96" />
      )) : null}
      {isLoading && <div className="loading loading-spinner mx-auto md:col-span-2 w-5 h-5" />}
      {hasNextPage && !isLoading && <button onClick={loadMore} className="btn btn-ghost md:col-span-2">Load More</button>}
    </div>
  );
}
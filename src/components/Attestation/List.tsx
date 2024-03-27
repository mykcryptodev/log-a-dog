import { useContext, useState, useEffect, useRef, type FC, useCallback, forwardRef } from "react";
import { EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { Attestation } from "~/components/Attestation";

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

  const observer = useRef<IntersectionObserver | null>(null);
  const lastAttestationRef = useCallback((node: HTMLElement | null) => {
    console.log({ hasNextPage, shouldFetch: 'not yet...' });
    if (isLoading || !hasNextPage) {
      console.log('Loading or no next page, return early');
      return;
    }
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      console.log({ shouldFetch: entries?.[0]?.isIntersecting })
      if (entries?.[0]?.isIntersecting) {
        console.log('Intersection observed, fetching next page');
        setCursor(attestations[attestations.length - 1]?.id);
      }
    });
    if (node) {
      console.log('Observing node:', node);
      observer.current.observe(node);
    }
  }, [hasNextPage, attestations, isLoading]);
  

  useEffect(() => {
    if (data?.attestations) {
      setAttestations(prev => [...prev, ...data.attestations]);
    }
  }, [data?.attestations]);

  useEffect(() => {
    if (refetchTimestamp) {
      setCursor(undefined);
      setAttestations([]);
      void refetch();
    }
  }, [refetch, refetchTimestamp]);
  type AttestationWrapperProps = {
    attestation: AttestationT;
  }
  const AttestationWrapper = forwardRef<HTMLDivElement, AttestationWrapperProps>((props, ref) => {
    AttestationWrapper.displayName = "AttestationWrapper";
    return (
      <div ref={ref}>
        <Attestation 
          attestationId={props.attestation.id} 
          refreshAttestations={() => {
            // wait 5 seconds for the blockchain
            setTimeout(() => {
              setCursor(undefined);
              setAttestations([]);
              void refetch();
            }, 5000);
          }}
          onAttestationRevoked={(attestationId) => {
            setAttestations(prev => prev.filter(att => att.id !== attestationId));
          }}
        />
      </div>
    );
  });

  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
      {attestations.map((attestation, index) => (
        <AttestationWrapper 
          key={index} 
          attestation={attestation} 
          ref={attestations.length === index + 1 ? lastAttestationRef : null}
        />
      ))}
      {(isLoading && attestations.length === 0) ? Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="animate-pulse bg-base-200 rounded-lg h-96" />
      )) : null}
      {isLoading && <div className="loading loading-spinner mx-auto col-span-2 w-5 h-5" />}
    </div>
  );
}
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
  const [cursor, setCursor] = useState<number>(0);
  const [attestations, setAttestations] = useState<AttestationT[]>([]);
  const { data, refetch, isLoading } = api.attestation.getBySchemaId.useQuery({
    schemaId,
    chainId: activeChain.id,
    ...attestors && { attestors },
    ...startDate && { startDate: Math.floor(startDate.getTime() / 1000) },
    ...endDate && { endDate: Math.floor(endDate.getTime() / 1000) },
    cursor,
    itemsPerPage: 10,
  }, {
    enabled: !!schemaId && !!activeChain.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastAttestationRef = useCallback((node: HTMLElement | null) => {
    if (isLoading) return;
    if (!data?.nextCursor) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      if (entries?.[0]?.isIntersecting && data?.nextCursor) {
        setCursor(data.nextCursor);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, data?.nextCursor]);

  useEffect(() => {
    if (data?.attestations) {
      setAttestations(prev => [...prev, ...data.attestations]);
    }
  }, [data?.attestations]);

  useEffect(() => {
    if (refetchTimestamp) {
      setTimeout(() => {
        // wait 5 seconds for the blockchain
        void refetch();
      }, 5000);
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
              void refetch();
            }, 5000);
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
          ref={index === attestations.length - 1 ? lastAttestationRef : null}
        />
      ))}
      {isLoading && <div className="loading loading-spinner mx-auto" />}
    </div>
  );
};

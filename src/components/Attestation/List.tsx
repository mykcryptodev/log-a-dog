import { useContext, useState, useEffect, type FC } from "react";
import { EAS_SCHEMA_ID, LOG_A_DOG } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import { Attestation } from "~/components/Attestation";
import { MediaRenderer, TransactionButton, useActiveAccount } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";
import { HandThumbDownIcon, HandThumbUpIcon, TagIcon } from "@heroicons/react/24/outline";
import { HandThumbDownIcon as HandThumDownIconFilled, HandThumbUpIcon as HandThumbUpIconFilled } from "@heroicons/react/24/solid";
import { Avatar } from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import { ADDRESS_ZERO, getContract, sendTransaction } from "thirdweb";
import { toast } from "react-toastify";
import { attestHotdogLog } from "~/thirdweb/84532/0xdc0b97c9121f83cbe6852a844d91f7cae9ee422f";
import JudgeAttestation from "./Judge";

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
  const account = useActiveAccount();
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

  const { data: dogData, isLoading: isLoadingHotdogs, refetch: refetchDogData } = api.hotdog.getAll.useQuery({
    chainId: activeChain.id,
    user: account?.address ?? ADDRESS_ZERO,
  }, {
    enabled: !!activeChain.id,
  });

  useEffect(() => {
    if (!account) return;
    void refetchDogData();
  }, [account]);

  const [isLoadingValidAttestation, setIsLoadingValidAttestation] = useState<boolean>(false);
  const [isLoadingInvalidAttestation, setIsLoadingInvalidValidAttestation] = useState<boolean>(false);

  const attest = async (logId: bigint, isValid: boolean) => {
    if (!account) {
      return toast.error("You must login to attest to dogs!");
    }
    isValid ? setIsLoadingValidAttestation(true) : setIsLoadingInvalidValidAttestation(true);
    try {
      const transaction = attestHotdogLog({
        contract: getContract({
          chain: activeChain,
          address: LOG_A_DOG[activeChain.id]!,
          client,
        }),
        logId,
        isValid,
      });
      await sendTransaction({ transaction, account })
      toast.success("Attestation made!");
    } catch (error) {
      const e = error as Error;
      console.error(error);
      toast.error(`Attestation failed: ${e.message}`);
    } finally {
      isValid ? setIsLoadingValidAttestation(false) : setIsLoadingInvalidValidAttestation(false);
      void refetchDogData();
    }
  };

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
      {dogData?.hotdogs?.map((hotdog, index) => {
        const validAttestations = dogData?.validAttestations[index];
        const invalidAttestations = dogData?.invalidAttestations[index];
        const userAttested = dogData?.userAttested[index];
        const userAttestation = dogData?.userAttestations[index];
        console.log({ validAttestations, invalidAttestations, userAttestation, userAttested, hotdog, dogData });

        return (
          <div className="card bg-base-100 bg-opacity-50" key={hotdog.logId}>
            <div className="card-body p-4 max-w-xs">
              <div className="flex gap-2 items-center">
                <Avatar address={hotdog.eater} />
                <Name address={hotdog.eater} />
              </div>
              <MediaRenderer
                src={hotdog.imageUri}
                client={client}
                className="rounded-lg"
                width={"100%"}
                height={"100%"}
              />
              <div className="flex w-full items-center space-between opacity-50">
                <div className="text-xs w-full flex items-center">
                  <TagIcon className="w-4 h-4" />
                  {hotdog.logId.toString()}
                </div>
                <div className="flex justify-end items-center gap-2">
                  <JudgeAttestation
                    userAttested={userAttested}
                    userAttestation={userAttestation}
                    validAttestations={validAttestations}
                    invalidAttestations={invalidAttestations}
                    logId={hotdog.logId}
                    onAttestationMade={() => void refetchDogData()}
                    onAttestationAffirmationRevoked={() => void refetchDogData()}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
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
import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/outline";
import { HandThumbDownIcon as HandThumDownIconFilled, HandThumbUpIcon as HandThumbUpIconFilled } from "@heroicons/react/24/solid";
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

type Props = {
  disabled?: boolean;
  logId: string;
  chainId: number;
  userAttested: boolean | undefined;
  userAttestation: boolean | undefined;
  validAttestations: string | undefined;
  invalidAttestations: string | undefined;
  onAttestationMade?: () => void;
  onAttestationAffirmationRevoked?: () => void;
}

export const JudgeAttestation: FC<Props> = ({ 
  disabled,
  logId,
  chainId,
  userAttested,
  userAttestation,
  validAttestations,
  invalidAttestations,
  onAttestationMade,
  onAttestationAffirmationRevoked,
}) => {
  const { data: sessionData } = useSession();
  const [isLoadingValidAttestation, setIsLoadingValidAttestation] = useState<boolean>(false);
  const [isLoadingInvalidAttestation, setIsLoadingInvalidValidAttestation] = useState<boolean>(false);
  const [optimisticValidCount, setOptimisticValidCount] = useState<string | undefined>(validAttestations);
  const [optimisticInvalidCount, setOptimisticInvalidCount] = useState<string | undefined>(invalidAttestations);
  const [optimisticUserAttested, setOptimisticUserAttested] = useState<boolean | undefined>(userAttested);
  const [optimisticUserAttestation, setOptimisticUserAttestation] = useState<boolean | undefined>(userAttestation);

  const judgeMutation = api.hotdog.judge.useMutation({
    onMutate: async ({ isValid }) => {
      // Optimistically update the counts
      if (isValid) {
        setOptimisticValidCount(prev => prev ? (BigInt(prev) + BigInt(1)).toString() : "1");
        setOptimisticUserAttested(true);
        setOptimisticUserAttestation(true);
      } else {
        setOptimisticInvalidCount(prev => prev ? (BigInt(prev) + BigInt(1)).toString() : "1");
        setOptimisticUserAttested(true);
        setOptimisticUserAttestation(false);
      }
    },
    onSuccess: () => {
      toast.success("Attestation processed successfully!");
      void onAttestationMade?.();
    },
    onError: (error) => {
      // Revert optimistic updates on error
      setOptimisticValidCount(validAttestations);
      setOptimisticInvalidCount(invalidAttestations);
      setOptimisticUserAttested(userAttested);
      setOptimisticUserAttestation(userAttestation);
      toast.error(`Operation failed: ${error.message}`);
    },
  });

  const attest = async (isValid: boolean) => {
    if (disabled) return;
    if (!sessionData?.user?.address) {
      return toast.error("You must login to attest to dogs!");
    }
    isValid ? setIsLoadingValidAttestation(true) : setIsLoadingInvalidValidAttestation(true);
    
    // undo attestations if the user has already attested
    if (optimisticUserAttested && optimisticUserAttestation === isValid) {
      return void revoke(isValid);
    }

    try {
      await judgeMutation.mutateAsync({
        chainId,
        logId,
        isValid,
        shouldRevoke: false,
      });
    } finally {
      isValid ? setIsLoadingValidAttestation(false) : setIsLoadingInvalidValidAttestation(false);
    }
  };

  const revoke = async (isValid: boolean) => {
    if (disabled) return;
    if (!sessionData?.user?.address) {
      return toast.error("You must login to revoke your attestations!");
    }
    try {
      // Optimistically update the counts
      if (isValid) {
        setOptimisticValidCount(prev => prev ? (BigInt(prev) - BigInt(1)).toString() : "0");
      } else {
        setOptimisticInvalidCount(prev => prev ? (BigInt(prev) - BigInt(1)).toString() : "0");
      }
      setOptimisticUserAttested(false);
      setOptimisticUserAttestation(undefined);

      await judgeMutation.mutateAsync({
        chainId,
        logId,
        isValid,
        shouldRevoke: true,
      });
      void onAttestationAffirmationRevoked?.();
    } catch (error) {
      // Revert optimistic updates on error
      setOptimisticValidCount(validAttestations);
      setOptimisticInvalidCount(invalidAttestations);
      setOptimisticUserAttested(userAttested);
      setOptimisticUserAttestation(userAttestation);
    } finally {
      isValid ? setIsLoadingValidAttestation(false) : setIsLoadingInvalidValidAttestation(false);
    }
  };

  return (
    <div className="flex items-center">
      <button 
        className="btn btn-xs btn-circle btn-ghost w-fit px-2"
        onClick={() => attest(true)}
      >
        {isLoadingValidAttestation ? (
          <div className="loading loading-spinner w-4 h-4" />
        ) : (
          (optimisticValidCount ?? 0).toString()
        )}
        {optimisticUserAttested && optimisticUserAttestation === true ? (
          <HandThumbUpIconFilled className="w-4 h-4" />
        ) : (
          <HandThumbUpIcon className="w-4 h-4" />
        )}
      </button>
      <button 
        className="btn btn-xs btn-circle btn-ghost w-fit px-2"
        onClick={() => attest(false)}
      >
        {optimisticUserAttested && optimisticUserAttestation === false ? (
          <HandThumDownIconFilled className="w-4 h-4" />
        ) : (
          <HandThumbDownIcon className="w-4 h-4" />
        )}
        {isLoadingInvalidAttestation ? (
          <div className="loading loading-spinner w-4 h-4" />
        ) : (
          (optimisticInvalidCount ?? 0).toString()
        )}
      </button>
    </div>
  )
};

export default JudgeAttestation;
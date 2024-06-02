import { HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/outline";
import { HandThumbDownIcon as HandThumDownIconFilled, HandThumbUpIcon as HandThumbUpIconFilled } from "@heroicons/react/24/solid";
import { useState, type FC, useContext } from "react";
import { useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { LOG_A_DOG } from "~/constants/addresses";
import { toast } from "react-toastify";
import { client } from "~/providers/Thirdweb";
import { getContract, sendTransaction } from "thirdweb";
import { attestHotdogLog, revokeAttestation } from "~/thirdweb/84532/0x1bf5c7e676c8b8940711613086052451dcf1681d";
import { sendCalls, useCapabilities } from "thirdweb/wallets/eip5792";

type Props = {
  disabled?: boolean;
  logId: bigint;
  userAttested: boolean | undefined;
  userAttestation: boolean | undefined;
  validAttestations: bigint | undefined;
  invalidAttestations: bigint | undefined;
  onAttestationMade?: () => void;
  onAttestationAffirmationRevoked?: () => void;
}
export const JudgeAttestation: FC<Props> = ({ 
  disabled,
  logId,
  userAttested,
  userAttestation,
  validAttestations,
  invalidAttestations,
  onAttestationMade,
  onAttestationAffirmationRevoked,
}) => {
  const wallet = useActiveWallet();
  const { data: walletCapabilities } = useCapabilities();
  const { activeChain } = useContext(ActiveChainContext);

  const [isLoadingValidAttestation, setIsLoadingValidAttestation] = useState<boolean>(false);
  const [isLoadingInvalidAttestation, setIsLoadingInvalidValidAttestation] = useState<boolean>(false);

  const attest = async (isValid: boolean) => {
    if (disabled) return;
    if (!wallet) {
      return toast.error("You must login to attest to dogs!");
    }
    isValid ? setIsLoadingValidAttestation(true) : setIsLoadingInvalidValidAttestation(true);
    // undo attestations if the user has already attested
    if (userAttested && userAttestation === isValid) {
      return void revoke(isValid);
    }
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
      const chainIdAsHex = activeChain.id.toString(16) as unknown as number;
      if (walletCapabilities?.[chainIdAsHex]) {
        await sendCalls({
          chain: activeChain,
          wallet,
          calls: [transaction],
          capabilities: {
            paymasterService: {
              url: `https://${activeChain.id}.bundler.thirdweb.com/${client.clientId}`
            }
          },
        });
      } else {
        await sendTransaction({
          account: wallet.getAccount()!,
          transaction,
        });
      }
      toast.success("Attestation made!");
    } catch (error) {
      const e = error as Error;
      console.error(error);
      toast.error(`Attestation failed: ${e.message}`);
    } finally {
      isValid ? setIsLoadingValidAttestation(false) : setIsLoadingInvalidValidAttestation(false);
      void onAttestationMade?.();
    }
  };

  const revoke = async (isValid: boolean) => {
    if (disabled) return;
    if (!wallet) {
      return toast.error("You must login to revoke your attestations!");
    }
    try {
      const transaction = revokeAttestation({
        contract: getContract({
          chain: activeChain,
          address: LOG_A_DOG[activeChain.id]!,
          client,
        }),
        logId,
      });
      const chainIdAsHex = activeChain.id.toString(16) as unknown as number;
      if (walletCapabilities?.[chainIdAsHex]) {
        await sendCalls({
          chain: activeChain,
          wallet,
          calls: [transaction],
          capabilities: {
            paymasterService: {
              url: `https://${activeChain.id}.bundler.thirdweb.com/${client.clientId}`
            }
          },
        });
      } else {
        await sendTransaction({
          account: wallet.getAccount()!,
          transaction,
        });
      }
      toast.success("Attestation revoked!");
    }  catch (error) {
      const e = error as Error;
      toast.error(`Revocation failed: ${e.message}`);
    } finally {
      isValid ? setIsLoadingValidAttestation(false) : setIsLoadingInvalidValidAttestation(false);
      void onAttestationAffirmationRevoked?.();
    }
  }

  return (
    <div className="flex items-center">
      <button 
        className="btn btn-xs btn-circle btn-ghost w-fit px-2"
        onClick={() => attest(true)}
      >
        {isLoadingValidAttestation ? (
          <div className="loading loading-spinner w-4 h-4" />
        ) : (
          (validAttestations ?? 0).toString()
        )}
        {userAttested && userAttestation === true ? (
          <HandThumbUpIconFilled className="w-4 h-4" />
        ) : (
          <HandThumbUpIcon className="w-4 h-4" />
        )}
      </button>
      <button 
        className="btn btn-xs btn-circle btn-ghost w-fit px-2"
        onClick={() => attest(false)}
      >
        {userAttested && userAttestation === false ? (
          <HandThumDownIconFilled className="w-4 h-4" />
        ) : (
          <HandThumbDownIcon className="w-4 h-4" />
        )}
        {isLoadingInvalidAttestation ? (
          <div className="loading loading-spinner w-4 h-4" />
        ) : (
          (invalidAttestations ?? 0).toString()
        )}
      </button>
    </div>
  )
};

export default JudgeAttestation;
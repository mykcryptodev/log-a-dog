import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";
import RevokeAttestation from "./Revoke";
import { TagIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import JudgeAttestation from "~/components/Attestation/Judge";

type Props = {
  attestationId: string;
  refreshAttestations?: () => void;
  onAttestationRevoked?: (attestatinId: string) => void;
}
export const Attestation: FC<Props> = ({ attestationId, refreshAttestations, onAttestationRevoked, }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const account = useActiveAccount();
  const { data: attestation, refetch } = api.attestation.getById.useQuery({
    attestationId,
    chainId: activeChain.id,
  }, {
    enabled: !!attestationId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: profile } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: attestation?.decodedAttestaton.address ?? "",
  }, {
    enabled: !!attestation,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const copyAttestationId = async () => {
    try {
      await navigator.clipboard.writeText(attestationId);
      toast.success("Dog ID copied to clipboard!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy Dog ID to clipboard!");
    }
  }

  if (!attestation) return null;

  // turn the ipfs:// uri into a gateway uri
  const imgUri = attestation.decodedAttestaton.imgUri.replace("ipfs://", "https://ipfs.io/ipfs/");

  return (
    <div className="flex flex-col gap-2 bg-opacity-50 bg-base-200 rounded-lg p-4 h-fit">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {profile?.imgUrl && (
            <Image
              src={profile.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/")}
              alt="profile"
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span className="font-bold text-sm">
            {profile?.username ?? `${attestation.decodedAttestaton.address.slice(0, 4)}...${attestation.decodedAttestaton.address.slice(-4)}`}
          </span>
        </div>
        {account?.address.toLowerCase() === attestation.decodedAttestaton.address.toLowerCase() && (
          <RevokeAttestation 
            uid={attestationId}
            onAttestationRevoked={() => void onAttestationRevoked?.(attestationId)}
          />
        )}
      </div>
      <Image
        src={imgUri}
        alt="hotdog"
        width={250}
        height={250}
        className="rounded-lg w-full"
      />
      <div className="flex items-center justify-between opacity-50">
        <span 
          className="text-xs flex items-center cursor-pointer"
          onClick={() => void copyAttestationId()}
        >
          <TagIcon className="w-4 h-4" />
          {attestationId.slice(-5)}
        </span>
        <JudgeAttestation
          attestation={attestation}
          onAttestationAffirmed={() => {
            // give the blockchain 5 seconds
            setTimeout(() => {
              void refetch();
              refreshAttestations?.();
            }, 5000);
          }}
          onAttestationAffirmationRevoked={() => {
            // give the blockchain 5 seconds
            setTimeout(() => {
              void refetch();
              refreshAttestations?.();
            }, 5000);
          }}
        />
      </div>
    </div>
  )
};
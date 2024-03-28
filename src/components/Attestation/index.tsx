import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import RevokeAttestation from "./Revoke";
import { TagIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import JudgeAttestation from "~/components/Attestation/Judge";
import { client } from "~/providers/Thirdweb";
import dynamic from "next/dynamic";

const CustomMediaRenderer = dynamic(
  () => import('~/components/utils/CustomMediaRenderer'),
  { ssr: false }
);

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

  return (
    <div className="flex flex-col gap-2 bg-opacity-50 bg-base-200 rounded-lg p-4 h-fit">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {profile?.imgUrl && (
            <CustomMediaRenderer
              src={profile.imgUrl}
              alt={profile.username}
              className="rounded-full"
              width={"24px"}
              height={"24px"} 
              client={client}
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
      <CustomMediaRenderer
        src={attestation.decodedAttestaton.imgUri}
        alt="hotdog"
        className="rounded-lg w-full"
        width={"250px"}
        height={"250px"} 
        client={client}
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
import { type Attestation, EAS, SchemaEncoder, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { HandThumbUpIcon } from "@heroicons/react/24/outline";
import { HandThumbUpIcon as HandThumbUpIconFilled} from "@heroicons/react/24/solid";
import { useState, type FC, useContext, useEffect } from "react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { EAS as EAS_ADDRESS, EAS_AFFIMRATION_SCHEMA_ID } from "~/constants/addresses";
import { toast } from "react-toastify";
import { client } from "~/providers/Thirdweb";

type Judgement = {
  id: string,
  attester: string,
  timeCreated: number,
  decodedDataJson: string,
}

type Props = {
  attestation: {
    affirmations: Judgement[];
    attestation: Attestation;
    decodedAttestaton: {
      address: string;
      imgUri: string;
      metadata: string;
      uid: string;
    };
    refutations: Judgement[];
  };
  onAttestationAffirmed?: () => void;
  onAttestationAffirmationRevoked?: () => void;
}
export const AffirmAttestation: FC<Props> = ({ 
  attestation, 
  onAttestationAffirmed,
  onAttestationAffirmationRevoked,
}) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { activeChain } = useContext(ActiveChainContext);
  const schemaUid = EAS_AFFIMRATION_SCHEMA_ID[activeChain.id]!;
  const easContractAddress = EAS_ADDRESS[activeChain.id]!;
  const eas = new EAS(easContractAddress);

  const [usersAffirmation, setUsersAffirmation] = useState<Judgement>();
  const [usersRefutation, setUsersRefutation] = useState<Judgement>();

  useEffect(() => {
    const usersAffirmation = attestation.affirmations.find((affirmation) =>
      affirmation.attester.toLowerCase() === account?.address.toLowerCase()
    );
    setUsersAffirmation(usersAffirmation);
  }, [account?.address, attestation.affirmations]);

  useEffect(() => {
    const usersRefutation = attestation.refutations.find((refutation) =>
      refutation.attester.toLowerCase() === account?.address.toLowerCase()
    );
    setUsersRefutation(usersRefutation);
  }, [account?.address, attestation.refutations]);

  console.log({ usersAffirmation });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const affirm = async () => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      toast.error("You must login to affirm dogs");
      return;
    }
    const signer = await ethers6Adapter.signer.toEthers(client, account, activeChain) as TransactionSigner;

    // get the signer from ethers
    const schemaEncoder = new SchemaEncoder("bool isAffirmed");
    const encodedData = schemaEncoder.encodeData([
      { name: "isAffirmed", value: true, type: "bool" },
    ]);
    try {
      setIsLoading(true);
      eas.connect(signer);
      await eas.attest({
        schema: schemaUid,
        data: {
          recipient: account.address,
          expirationTime: BigInt(0),
          revocable: true,
          refUID: attestation.decodedAttestaton.uid,
          data: encodedData,
        },
      });
      onAttestationAffirmed?.();
      toast.success("Dog has been attested to!");
      setUsersAffirmation({
        id: "0",
        attester: account.address,
        timeCreated: Date.now(),
        decodedDataJson: "",      
      });
      setIsLoading(false);
    } catch (e) {
      // pop notification
      console.error(e);
      toast.error("Failed to attest to dog");
    }
  };

  const revoke = async () => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      toast.error("You must login to revoke dogs");
      return;
    }
    if (!usersAffirmation) {
      toast.error("You have not affirmed this dog!");
      return;
    }
    const signer = await ethers6Adapter.signer.toEthers(client, account, activeChain) as TransactionSigner;

    try {
      setIsLoading(true);
      eas.connect(signer);
      await eas.revoke({
        schema: schemaUid,
        data: { uid: usersAffirmation.id },
      });
      setUsersAffirmation(undefined);
      onAttestationAffirmationRevoked?.();
      toast.success("Dog has been revoked!");
    } catch (e) {
      // pop notification
      console.error(e);
      toast.error("Failed to revoke dog");
    } finally { 
      setIsLoading(false);
    }
  }

  // do not show for the user who made the original attestation
  if (attestation.decodedAttestaton.address.toLowerCase() === account?.address.toLowerCase()) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-4 h-4 loading loading-spinner" />
    )
  }

  if (usersAffirmation) {
    return (
      <HandThumbUpIconFilled
        className="w-4 h-4 cursor-pointer"
        onClick={revoke}
      />
    )
  }

  return (
    <HandThumbUpIcon 
      className="w-4 h-4 cursor-pointer" 
      onClick={affirm}
    />
  )
};

export default AffirmAttestation;
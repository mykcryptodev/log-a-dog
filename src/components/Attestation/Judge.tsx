import { type Attestation, EAS, SchemaEncoder, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/24/outline";
import { 
  HandThumbUpIcon as HandThumbUpIconFilled,
  HandThumbDownIcon as HandThumbDownIconFilled,
} from "@heroicons/react/24/solid";
import { useState, type FC, useContext, useEffect } from "react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { EAS as EAS_ADDRESS, EAS_AFFIMRATION_SCHEMA_ID } from "~/constants/addresses";
import { toast } from "react-toastify";
import { client } from "~/providers/Thirdweb";
import { getRpcClient, eth_maxPriorityFeePerGas, } from "thirdweb/rpc";

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
export const JudgeAttestation: FC<Props> = ({ 
  attestation, 
  onAttestationAffirmed,
  onAttestationAffirmationRevoked,
}) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { activeChain, updateActiveChainRpc } = useContext(ActiveChainContext);
  const schemaUid = EAS_AFFIMRATION_SCHEMA_ID[activeChain.id]!;
  const easContractAddress = EAS_ADDRESS[activeChain.id]!;
  const eas = new EAS(easContractAddress);

  const [usersAffirmation, setUsersAffirmation] = useState<Judgement>();
  const [usersRefutation, setUsersRefutation] = useState<Judgement>();
  const [showImmediateFeedback, setShowImmediateFeedback] = useState<boolean>(false);
  const [showImmediateExtraAffirmation, setShowImmediateExtraAffirmation] = useState<boolean>(false);

  const rpcRequest = getRpcClient({ client, chain: activeChain });

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

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const castJudgement = async (isAffirmed: boolean) => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      toast.error("You must login to affirm dogs");
      return;
    }
    if (account.address.toLowerCase() === attestation.decodedAttestaton.address.toLowerCase()) {
      toast.warning("You cannot judge your own logs");
      return;
    }
    const signer = await ethers6Adapter.signer.toEthers(client, account, activeChain) as TransactionSigner;

    // get the signer from ethers
    const schemaEncoder = new SchemaEncoder("bool isAffirmed");
    const encodedData = schemaEncoder.encodeData([
      { name: "isAffirmed", value: isAffirmed, type: "bool" },
    ]);
    try {
      setIsLoading(true);
      setShowImmediateFeedback(true);
      if (isAffirmed) {
        setShowImmediateExtraAffirmation(true);
      }
      eas.connect(signer);
      const maxPriorityFeePerGas = await eth_maxPriorityFeePerGas(rpcRequest);
      await eas.attest({
        schema: schemaUid,
        data: {
          recipient: account.address,
          expirationTime: BigInt(0),
          revocable: true,
          refUID: attestation.decodedAttestaton.uid,
          data: encodedData,
        },
      }, {
        maxPriorityFeePerGas,
      });
      onAttestationAffirmed?.();
    } catch (e) {
      // pop notification
      console.error(e);
      toast.error("Failed to attest to dog, try again!");
      updateActiveChainRpc(activeChain.rpcToUpdate);
    } finally {
      // callbacks wait 5s for the blockchain to catch up
      // so keep act like your loading so that the user isnt confused
      setTimeout(() => {
        setIsLoading(false);
        setShowImmediateFeedback(false);
        setShowImmediateExtraAffirmation(false);
      }, 5000);
    }
  };

  const revoke = async (uid: string) => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      toast.error("You must login to revoke dogs");
      return;
    }
    if (account.address.toLowerCase() === attestation.decodedAttestaton.address.toLowerCase()) {
      toast.warning("You cannot judge your own logs");
      return;
    }
    const signer = await ethers6Adapter.signer.toEthers(client, account, activeChain) as TransactionSigner;

    try {
      setIsLoading(true);
      eas.connect(signer);
      await eas.revoke({
        schema: schemaUid,
        data: { uid },
      });
      setUsersAffirmation(undefined);
      onAttestationAffirmationRevoked?.();
    } catch (e) {
      // pop notification
      console.error(e);
      toast.error("Failed to revoke dog, try again!");
    } finally { 
      // callbacks wait 5s for the blockchain to catch up
      // so keep act like your loading so that the user isnt confused
      setTimeout(() => {
        setIsLoading(false);
      }, 5000);
    }
  }

  const ThumbsDown: FC = () => {
    if (usersRefutation && !usersAffirmation) {
      return (
        <HandThumbDownIconFilled
          className="w-4 h-4 cursor-pointer"
          onClick={() => {
            void revoke(usersRefutation.id);
          }}
        />
      )
    }
    if (!usersRefutation && usersAffirmation) {
      return (
        <HandThumbDownIcon
          className="w-4 h-4 cursor-pointer"
          onClick={async () => {
            await revoke(usersAffirmation.id);
            void castJudgement(false);
          }}
        />
      )
    }
    // handle issues we shouldnt have
    if (usersRefutation && usersAffirmation) {
      return (
        <HandThumbUpIcon 
          className="w-4 h-4 cursor-pointer" 
          onClick={async () => {
            const allUserAffirmations = attestation.affirmations.filter(r => 
              r.attester.toLowerCase() === account?.address.toLowerCase()
            );
            await Promise.all(allUserAffirmations.map(r => revoke(r.id)));
          }}
        />
      )
    }
    return (
      <HandThumbDownIcon
        className="w-4 h-4 cursor-pointer"
        onClick={() => {
          void castJudgement(false);
        }}
      />
    )
  }

  const ThumbsUp: FC = () => {
    if (!usersRefutation && usersAffirmation) {
      return (
        <HandThumbUpIconFilled 
          className="w-4 h-4 cursor-pointer" 
          onClick={() => {
            void revoke(usersAffirmation.id);
          }}
        />
      )
    }
    if (usersRefutation && !usersAffirmation) {
      return (
        <HandThumbUpIcon 
          className="w-4 h-4 cursor-pointer" 
          onClick={async () => {
            await revoke(usersRefutation.id);
            void castJudgement(true);
          }}
        />
      )
    }
    // handle issues we shouldnt have
    if (usersRefutation && usersAffirmation) {
      return (
        <HandThumbUpIcon 
          className="w-4 h-4 cursor-pointer" 
          onClick={async () => {
            const allUserRefutations = attestation.refutations.filter(r => 
              r.attester.toLowerCase() === account?.address.toLowerCase()
            );
            await Promise.all(allUserRefutations.map(r => revoke(r.id)));
          }}
        />
      )
    }
    return (
      <HandThumbUpIcon 
        className="w-4 h-4 cursor-pointer" 
        onClick={() => {
          void castJudgement(true);
        }}
      />
    )
  }

  if (showImmediateFeedback) {
    if (showImmediateExtraAffirmation) {
      return (
        <div className="flex items-center">
          <button className="btn btn-ghost btn-xs">
            <div className="badge badge-ghost badge-xs">{attestation.affirmations.length + 1}</div>
            <HandThumbUpIconFilled className="w-4 h-4 cursor-not-allowed" />
          </button>
          <button className="btn btn-ghost btn-xs">
            <HandThumbDownIcon className="w-4 h-4 cursor-not-allowed" />
            <div className="badge badge-ghost badge-xs">{attestation.refutations.length}</div>
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center">
        <button className="btn btn-ghost btn-xs">
          <div className="badge badge-ghost badge-xs">{attestation.affirmations.length}</div>
          <HandThumbUpIcon className="w-4 h-4 cursor-not-allowed" />
        </button>
        <button className="btn btn-ghost btn-xs">
          <HandThumbDownIconFilled className="w-4 h-4 cursor-not-allowed" />
          <div className="badge badge-ghost badge-xs">{attestation.refutations.length + 1}</div>
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center animate-pulse">
        <button className="btn btn-ghost btn-xs">
          <div className="badge badge-ghost badge-xs">{attestation.affirmations.length}</div>
          <HandThumbUpIcon className="w-4 h-4 cursor-not-allowed" />
        </button>
        <button className="btn btn-ghost btn-xs">
          <HandThumbDownIcon className="w-4 h-4 cursor-not-allowed" />
          <div className="badge badge-ghost badge-xs">{attestation.refutations.length}</div>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      <button className="btn btn-ghost btn-xs">
        <div className="badge badge-ghost badge-xs">{attestation.affirmations.length}</div>
        <ThumbsUp />
      </button>
      <button className="btn btn-ghost btn-xs">
        <ThumbsDown />
        <div className="badge badge-ghost badge-xs">{attestation.refutations.length}</div>
      </button>
    </div>
  )
};

export default JudgeAttestation;
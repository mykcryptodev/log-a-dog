import { EAS, SchemaEncoder, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import { type FC,useContext, useState } from 'react';
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { EAS as EAS_ADDRESS, EAS_SCHEMA_ID } from "~/constants/addresses";
import ActiveChainContext from "~/contexts/ActiveChain";
import { client } from "~/providers/Thirdweb";
import Upload from "~/components/utils/Upload";
import { toast } from "react-toastify";

export const CreateAttestation: FC = () => {
  const [numHotdogs, setNumHotdogs] = useState<number>(1);
  const [imgUri, setImgUri] = useState<string>("");

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { activeChain } = useContext(ActiveChainContext);

  const schemaUid = EAS_SCHEMA_ID[activeChain.id]!;
  const easContractAddress = EAS_ADDRESS[activeChain.id]!;
  const eas = new EAS(easContractAddress);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const create = async (numEaten: number) => {
    if (!account || !wallet || !ethers6Adapter) {
      // pop notification
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const signer = await ethers6Adapter.signer.toEthers(client, wallet) as TransactionSigner;

    // get the signer from ethers
    const schemaEncoder = new SchemaEncoder("address hotdog_eater,uint256 num_hotdogs_eaten,string image_uri,string metadata");
    const encodedData = schemaEncoder.encodeData([
      { name: "hotdog_eater", value: account.address, type: "address" },
      { name: "num_hotdogs_eaten", value: numEaten, type: "uint256" },
      { name: "image_uri", value: imgUri, type: "string"},
      { name: "metadata", value: "", type: "string" }
    ]);
    try {
      setIsLoading(true);
      eas.connect(signer);
      const tx = await eas.attest({
        schema: schemaUid,
        data: {
          recipient: account.address,
          expirationTime: BigInt(0),
          revocable: true,
          data: encodedData,
        },
      });
      const newAttestationUID = await tx.wait();
      console.log({ newAttestationUID })
      // pop notification
    } catch (e) {
      // pop notification
    } finally { 
      setIsLoading(false);
      // close modal
      (document.getElementById('create_attestation_modal') as HTMLDialogElement).close();
    }
  };

  return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button className="btn" onClick={()=>(document.getElementById('create_attestation_modal') as HTMLDialogElement).showModal()}>
        Create Attestation
      </button>
      <dialog id="create_attestation_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-2xl mb-4">Create Attestation</h3>
          <div className="flex flex-col gap-2">
            <div className="w-full text-center">
              Number of Hotdogs
            </div>
            <div className="w-full gap-2 flex justify-around items-center border rounded-lg px-4">
              <button 
                className="btn btn-ghost"
                onClick={() => setNumHotdogs((quantity) => {
                  if (quantity === 1) return 1
                  return quantity - 1
                })}
              >
                {/* Minus Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
                </svg>
              </button>
              <div className="w-full text-center">
                {numHotdogs}
              </div>
              <button
                className="btn btn-ghost join-item"
                onClick={() => setNumHotdogs((quantity) => quantity + 1)}
              >
                {/* Plus Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            <div className="w-full text-center">
              Proof
            </div>
            <Upload onUpload={({ uris }) => {
              if (!uris) return;
              setImgUri(uris[0]!);
            }} />
            {imgUri && (
              <div className="w-full">
                {imgUri}
              </div>
            
            )}
          </div>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
            <button 
              className="btn btn-primary" 
              disabled={isLoading}
              onClick={() => void create(1)}
            >
              {isLoading && <div className="loading loading-spinner" />}
              Create Attestation
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
};
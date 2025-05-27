import { useState, type FC, useContext } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import useDebounce from "~/hooks/useDebounce";
import { api } from "~/utils/api";
import Image from "next/image";
import { TransactionButton } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "~/providers/Thirdweb";
import { CONTESTS } from "~/constants/addresses";
import { toast } from "react-toastify";

type Props = {
  contestId: number;
  onContestantsAdded?: (contestants: {
    address: string;
    imgUrl: string;
    username: string;
    metadata?: string;
  }[]) => void;
}
export const AddContestants: FC<Props> = ({ contestId, onContestantsAdded }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 500);
  const { 
    data: profileSearchResult, 
    isLoading: profileSearchIsLoading 
  } = api.profile.search.useQuery({
    chainId: activeChain.id,
    query: debouncedQuery,
  }, {
    enabled: !!debouncedQuery,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const [contestantsToAdd, setContestantsToAdd] = useState<{
    address: string;
    imgUrl: string;
    username: string;
    metadata?: string;
  }[]>([]);

  const contract = getContract({
    client,
    address: CONTESTS[activeChain.id]!,
    chain: activeChain,
  });

  const tx = prepareContractCall({
    contract,
    method: "function addToContest(uint256 id, address[] participants)",
    params: [BigInt(contestId), contestantsToAdd.map((c) => c.address)],
  });

  return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button className="btn mr-4" onClick={()=>(document.getElementById('add_contestants_modal') as HTMLDialogElement).showModal()}>
        Add Contestants
      </button>
      <dialog id="add_contestants_modal" className="modal">
        <div className="modal-box relative">
          <button 
            className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4"
            onClick={()=>(document.getElementById('add_contestants_modal') as HTMLDialogElement).close()}
          >
            &times;
          </button>
          <h3 className="font-bold text-2xl mb-4">Add Contestants</h3>
          <div className="flex flex-col gap-2">
            <span className="mb-2">Search for contestants to add by their username or their address. Usernames are case sensitive!</span>
            <input
              type="text"
              className="input input-bordered text-center"
              placeholder="Username or Address"
              onChange={(e) => setQuery(e.target.value)}
              value={query}
            />
            {profileSearchIsLoading && query !== "" && (
              <div className="flex items-center gap-1 p-4 rounded-lg bg-base-200 animate-pulse">
                <div className="bg-neutral rounded-full animate-pulse w-8 h-8" />
                <div className="bg-neutral rounded-lg animate-pulse w-32 h-6" />
              </div>
            )}
            {!profileSearchResult || profileSearchResult.length === 0 ? (
              <div className={`flex items-center gap-1 p-4 rounded-lg bg-base-200 ${query === "" || profileSearchIsLoading ? 'hidden' : ''}`}>
                <span>No results</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {profileSearchResult.map((profile) => (
                  <div key={profile.address} className="flex justify-between items-center gap-1 p-4 rounded-lg bg-base-200">
                    <div className="flex items-start gap-2">
                      <Image
                        src={profile.imgUrl?.replace("ipfs://", "https://ipfs.io/ipfs/") ?? ""}
                        alt="profile"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex flex-col">
                        <span>{profile.username}</span>
                        <span className="text-xs opacity-50">{profile.address?.slice(0,6) + '...' + profile.address?.slice(-4)}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        if (profile.address) {
                          setContestantsToAdd([...contestantsToAdd, {
                            address: profile.address,
                            username: profile.username,
                            imgUrl: profile.imgUrl ?? "",
                            metadata: typeof profile.metadata === 'string' 
                              ? profile.metadata 
                              : JSON.stringify(profile.metadata)
                          }]);
                          setQuery("");
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            {contestantsToAdd.length > 0 && (
              <>
                <div className="text-lg font-bold mt-4">Contestants to Add</div>
                <div className="flex flex-col items-center gap-2 bg-base-200 p-4 rounded-lg">
                  {contestantsToAdd.map((contestant) => (
                    <div key={contestant.address} className="flex w-full justify-between items-center gap-1">
                      <div className="flex items-start gap-2">
                        <Image
                          src={contestant.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/")}
                          alt="profile"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex flex-col">
                          <span>{contestant.username}</span>
                          <span className="text-xs opacity-50">{contestant.address.slice(0,6) + '...' + contestant.address.slice(-4)}</span>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          setContestantsToAdd(contestantsToAdd.filter((c) => c.address !== contestant.address));
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <TransactionButton
                  transaction={() => tx}
                  onTransactionSent={() => {
                    toast.info("Adding contestants...");
                    // close the modal
                    (document.getElementById('add_contestants_modal') as HTMLDialogElement).close();
                  }}
                  onTransactionConfirmed={() => {
                    toast.dismiss();
                    toast.success("Contestants added!");
                    onContestantsAdded?.(contestantsToAdd);
                    setContestantsToAdd([]);
                  }}
                  onError={(e) => {
                    toast.error(e.message);
                    (document.getElementById('add_contestants_modal') as HTMLDialogElement).close();
                  }}
                >
                  Add Contestants
                </TransactionButton>
              </>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
};

export default AddContestants;
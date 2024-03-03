import { useState, type FC, useContext, useEffect, useMemo } from "react";
import { TransactionButton, useActiveAccount, useContractEvents } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import ActiveChainContext from "~/contexts/ActiveChain";
import { CONTESTS } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { toast } from "react-toastify";


const getIsoStringInUserTimezone = (date: Date) => {
  // if the date is invalid, return today
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  const offsetMs = date.getTimezoneOffset() * 60 * 1000; // Get timezone offset in milliseconds
  const localDate = new Date(date.getTime() - offsetMs); // Subtract offset to get local date
  const isoString = localDate.toISOString().slice(0, 16); // Get ISO date string (YYYY-MM-DDTHH:mm)
  return isoString;
}

type Props = {
  onContestSaved?: (contest: {
    username: string;
    imgUrl: string;
    metadata?: string;
  }) => void;
  action: "create" | "update";
  contest?: {
    id: string;
    name: string;
    metadata: string;
    startDate: number;
    endDate: number;
  };
}

export const ContestForm: FC<Props> = ({ onContestSaved, action, contest }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const account = useActiveAccount();
  const [name, setName] = useState<string>("");
  const [metadata, setMetadata] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getIsoStringInUserTimezone(new Date(new Date().getTime())));
  const [endDate, setEndDate] = useState<string>(getIsoStringInUserTimezone(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));

  useEffect(() => {
    if (contest) {
      setName(contest.name);
      setMetadata(contest.metadata);
      setStartDate(new Date(contest.startDate).getTime().toString());
      setEndDate(new Date(contest.endDate).getTime().toString());
    }
  }, [contest]);

  const contract = getContract({
    client,
    address: CONTESTS[activeChain.id]!,
    chain: activeChain,
  });
  const contractEvents = useContractEvents({
    contract
  });
  console.log({ contractEvents });

  const createContestMethod = "function createContest(string name, string metadata, uint256 start, uint256 end)";
  const updateContestMethod = "function updateContest(uint256 id, string name, string metadata, uint256 start, uint256 end)";

  const createParams = useMemo(() => {
    type CreateParams = [string, string, bigint, bigint];
    return [name, metadata, BigInt(new Date(startDate).getTime()), BigInt(new Date(endDate).getTime())] as CreateParams;
  }, [name, metadata, startDate, endDate]);

  const updateParams = useMemo(() => {
    type UpdateParams = [bigint, string, string, bigint, bigint];
    return [BigInt(contest?.id ?? 0), name, metadata, BigInt(new Date(startDate).getTime()), BigInt(new Date(endDate).getTime())] as UpdateParams;
  }, [contest, name, metadata, startDate, endDate]);

  const createTx = prepareContractCall({
    contract,
    method: createContestMethod,
    params: createParams,
  });

  const updateTx = prepareContractCall({
    contract,
    method: updateContestMethod,
    params: updateParams ,
  });

  if (!account) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* make an input for name */}
      <input
        type="text"
        className="input input-bordered text-center"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      {/* make an input for metadata */}
      <textarea
        className="input input-bordered text-center hidden"
        value={metadata}
        onChange={(e) => setMetadata(e.target.value)}
        placeholder="Metadata"
      />
      <input
        type="datetime-local"
        className="input input-bordered text-center"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        placeholder="Start Date"
      />
      <input
        type="datetime-local"
        className="input input-bordered text-center"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        placeholder="End Date"
      />
      <TransactionButton
        transaction={() => action === "create" ? createTx : updateTx}
        onSubmitted={(tx) => {
          console.log({ tx})
          toast.info("Saving...");
          // wait 5 seconds
          setTimeout(() => {
            void contractEvents.refetch();
            console.log({ refetched: true, contractEvents });
          }, 5000);
        }}
        onReceipt={() => toast.success("Contest saved")}
        onError={(e) => {
          toast.error(e.message);
          (document.getElementById('contest_modal') as HTMLDialogElement).close();
        }}
      >
        {action === 'create' ? "Create" : "Update"}
      </TransactionButton>
    </div>
  )
};
import { useState, type FC, useContext, useEffect, useMemo } from "react";
import { TransactionButton, useActiveAccount, useContractEvents } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import ActiveChainContext from "~/contexts/ActiveChain";
import { CONTESTS } from "~/constants/addresses";
import { client } from "~/providers/Thirdweb";
import { toast } from "react-toastify";
import { api } from "~/utils/api";
import { ProfileButton } from "../Profile/Button";


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
    id: string;
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
    isInviteOnly: boolean;
  };
}

export const ContestForm: FC<Props> = ({ onContestSaved, action, contest }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const account = useActiveAccount();
  const { data: profile, refetch: refetchProfile } = api.profile.getByAddress.useQuery({
    chainId: activeChain.id,
    address: account?.address ?? "",
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const [name, setName] = useState<string>("");
  const [metadata, setMetadata] = useState<string>("");
  const [isInviteOnly, setIsInviteOnly] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(getIsoStringInUserTimezone(new Date(new Date().getTime())));
  const [endDate, setEndDate] = useState<string>(getIsoStringInUserTimezone(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));

  useEffect(() => {
    if (contest) {
      setName(contest.name);
      setMetadata(contest.metadata);
      setStartDate(new Date(contest.startDate).getTime().toString());
      setEndDate(new Date(contest.endDate).getTime().toString());
      setIsInviteOnly(contest.isInviteOnly);
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

  const createContestMethod = "function createContest(string name, string metadata, uint256 start, uint256 end, bool isInviteOnly)";
  const updateContestMethod = "function updateContest(uint256 id, string name, string metadata, uint256 start, uint256 end, bool isInviteOnly)";

  const createParams = useMemo(() => {
    type CreateParams = [string, string, bigint, bigint, boolean];
    return [name, metadata, BigInt(new Date(startDate).getTime()), BigInt(new Date(endDate).getTime()), isInviteOnly] as CreateParams;
  }, [name, metadata, startDate, endDate, isInviteOnly]);

  const updateParams = useMemo(() => {
    type UpdateParams = [bigint, string, string, bigint, bigint, boolean];
    return [BigInt(contest?.id ?? 0), name, metadata, BigInt(new Date(startDate).getTime()), BigInt(new Date(endDate).getTime()), isInviteOnly] as UpdateParams;
  }, [contest?.id, name, metadata, startDate, endDate, isInviteOnly]);

  const createTx = prepareContractCall({
    contract,
    method: createContestMethod,
    params: createParams,
  });

  const updateTx = prepareContractCall({
    contract,
    method: updateContestMethod,
    params: updateParams,
  });

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
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={isInviteOnly}
          onChange={(e) => setIsInviteOnly(e.target.checked)}
        />
        <span>Is Invite Only</span>
      </label>
      {!profile || profile.username === "" ? (
        <div className="flex justify-center w-full my-4">
          <ProfileButton
            loginBtnLabel="Login to create contests"
            createProfileBtnLabel="Create profile to create contest"
            onProfileCreated={() => void refetchProfile()}
          />
        </div>
      ) : (
        <TransactionButton
          style={{ width: '100%', marginTop: '16px' }}
          waitForReceipt
          transaction={() => action === "create" ? createTx : updateTx}
          onSubmitted={(tx) => {
            toast.info("Saving...");
          }}
          onReceipt={(receipt) => {
            console.log({ receipt, topics: receipt.logs[0]?.topics[1] });
            toast.dismiss();
            toast.success("Contest saved");
            onContestSaved?.({
              id: BigInt(receipt.logs[0]?.topics[1] ?? 0).toString(),
              username: profile.username,
              imgUrl: profile.imgUrl,
              metadata,
            });
          }}
          onError={(e) => {
            toast.error(e.message);
            (document.getElementById('contest_modal') as HTMLDialogElement)?.close();
          }}
        >
          {action === 'create' ? "Create" : "Update"}
        </TransactionButton>
      )}
    </div>
  )
};
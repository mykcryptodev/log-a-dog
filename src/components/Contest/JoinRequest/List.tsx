import Image from "next/image";
import { useContext, type FC } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import AcceptJoinRequest from "./AcceptRequest";
import { useActiveAccount } from "thirdweb/react";
import RejectJoinRequest from "./RejectRequest";

type Props = {
  contest: {
    id: string;
    name: string;
    metadata: string;
    startDate: Date;
    endDate: Date;
    creator: string;
    contestants: readonly string[];
    isInviteOnly: boolean;
  };
  onRequestAccepted?: (contestId: number) => void;
  onRequestRejected?: (contestId: number) => void;
}
export const JoinRequestList: FC<Props> = ({ contest, onRequestAccepted, onRequestRejected }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const account = useActiveAccount();
  const { data: joinRequests, refetch } = api.contest.getJoinRequests.useQuery({
    id: Number(contest.id),
    chainId: activeChain.id,
  }, {
    enabled: !!contest.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: profiles } = api.profile.getManyByAddress.useQuery({
    chainId: activeChain.id,
    addresses: joinRequests as string[] ?? [],
  }, {
    enabled: !!joinRequests,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  return (
    <div className="flex flex-col gap-2">
      {joinRequests && joinRequests.length > 0 && (
        <div className="flex flex-col">
          <h2 className="font-bold">Join Requests</h2>
          <span className="text-sm opacity-50">
            Only the contest creator can accept or reject join requests
          </span>
        </div>
      )}
      {joinRequests?.map((request) => {
        const profile = profiles?.find((profile) => profile.address === request);
        return (
          <div key={request} className="flex items-center gap-2">
            <Image
              src={profile?.imgUrl?.replace("ipfs://", "https://ipfs.io/ipfs/") ?? ""}
              width={24}
              height={24}
              className="rounded-full"
              alt="profile"
            />
            <div>{profile?.username ?? request.substring(0,6) + '...' + request.substring(request.length - 4)}</div>
            {account?.address === contest.creator && (
              <div className="flex items-center gap-2">
                <AcceptJoinRequest
                  onRequestAccepted={() => {
                    onRequestAccepted?.(Number(contest.id));
                    void refetch();
                  }}
                  contest={contest}
                  requesterAddress={request}
                />
                <RejectJoinRequest
                  onRequestRejected={() => {
                    onRequestRejected?.(Number(contest.id));
                    void refetch();
                  }}
                  contest={contest}
                  requesterAddress={request}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
};

export default JoinRequestList;
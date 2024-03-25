import { type NextPage, type GetServerSideProps} from "next";
import { useContext, useState } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";
import Image from "next/image";
import { Leaderboard } from "~/components/Attestation/Leaderboard";
import { ListAttestations } from "~/components/Attestation/List";
import AddContestants from "~/components/Contest/AddContestants";
import { RemoveContestant } from "~/components/Contest/RemoveContestant";
import { useActiveAccount } from "thirdweb/react";
import JoinContest from "~/components/Contest/Join";
import JoinRequestList from "~/components/Contest/JoinRequest/List";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  return {
    props: {
      id,
    },
  };
};

export const Contest: NextPage<{id: string}> = ({ id }) => {
  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const { data: contest, refetch } = api.contest.getById.useQuery({
    id: parseInt(id),
    chainId: activeChain.id,
  }, {
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: profiles } = api.profile.getManyByAddress.useQuery({
    chainId: activeChain.id,
    addresses: contest?.contestants as string[] ?? [""],
  }, {
    enabled: !!contest?.contestants,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const [refetchTimestamp, setRefetchTimestamp] = useState<number>(0);
  const refreshData = () => {
    void refetch();
    setRefetchTimestamp(Date.now());
  };

  if (!contest || !profiles) return null;
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-bold">{contest.name}</h1>
      <div>Start Date: {contest.startDate.toLocaleString()}</div>
      <div>End Date: {contest.endDate.toLocaleString()}</div>
      <Leaderboard 
        attestors={contest.contestants as string[]}
        startDate={new Date(contest.startDate)}
        endDate={new Date(contest.endDate)}
        refetchTimestamp={refetchTimestamp}
      />
      <AddContestants 
        contestId={Number(contest.id)}
        onContestantsAdded={() => refreshData()}
      />
      <JoinContest 
        contest={contest}
        onContestJoined={() => refreshData()}
      />
      <JoinRequestList
        contest={contest}
        onRequestAccepted={() => refreshData()}
        onRequestRejected={() => refreshData()}
      />
      <span className="font-bold">Contestants</span>
      {profiles.map((profile) => (
        <div key={profile.username} className="flex items-center gap-1">
          <Image
            src={profile.imgUrl.replace("ipfs://", "https://ipfs.io/ipfs/")}
            alt="profile"
            width={24}
            height={24}
            className="rounded-full"
          />
          <div className="flex items-center gap-1">
            <span>{profile.username}</span>
            {contest.creator === profile.address && (
              <div className="badge badge-sm badge-accent">creator</div>
            )}
          </div>
          {contest.creator === account?.address && contest.creator !== profile.address && (
            <RemoveContestant 
              contestId={Number(contest.id)}
              contestantToRemove={profile}
              onContestantRemoved={() => refreshData()}
            />
          )}
        </div>
      ))}
      <ListAttestations 
        attestors={contest.contestants as string[]}
        startDate={new Date(contest.startDate)}
        endDate={new Date(contest.endDate)}
      />
    </div>
  )
};

export default Contest;
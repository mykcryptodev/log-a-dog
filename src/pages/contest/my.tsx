import { type NextPage } from "next";
import Link from "next/link";
import { useContext } from "react";
import { useActiveAccount } from "thirdweb/react";
import Connect from "~/components/utils/Connect";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";

export const MyContests: NextPage = () => {
  const account = useActiveAccount();
  const { activeChain } = useContext(ActiveChainContext);
  const { data, isLoading } = api.contest.getByUser.useQuery({
    address: account?.address ?? "",
    chainId: activeChain.id,
  }, {
    enabled: !!account?.address,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading) return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">My Contests</h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 border rounded-lg">
                <h2 className="font-bold">Loading...</h2>
                <div>Start Date: Loading...</div>
                <div>End Date: Loading...</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )

  if (!account) return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-2xl font-bold">My Contests</h1>
        <Connect loginBtnLabel="Login to View Contests" />
      </div>
    </main>
  )

  if (!data) return null;

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">My Contests</h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.map((contest) => (
              <Link href={`/contest/${contest.id}`} key={contest.id} className="flex flex-col gap-2 p-4 border rounded-lg">
                <h2 className="font-bold">{contest.name}</h2>
                <div>Start Date: {new Date(Number(contest.startDate)).toLocaleDateString()}</div>
                <div>End Date: {new Date(Number(contest.endDate)).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyContests;
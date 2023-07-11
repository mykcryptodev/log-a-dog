import { type NextPage } from "next";
import Link from "next/link";

import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import { api } from "~/utils/api";

export const Discover: NextPage = () => {
  const { data: contests } = api.contest.getAll.useQuery();

  return (
    <div>
      <h1 className="text-5xl font-bold mb-8">
        Discover
      </h1>
      <div className="flex flex-col gap-4">
        {contests?.map(contest => (
          <Link key={contest.id} href={`/contest/${contest.slug}`} className="card bg-base-200 rounded-lg">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">{contest.name}</span>
                <div className="flex items-center gap-2">
                  <span className="mr-2">Created by</span>
                  <Avatar address={contest.createdById} width={32} height={32} />
                  <Name address={contest.createdById} className="font-bold" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Discover;
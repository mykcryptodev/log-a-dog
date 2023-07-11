import { type NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

import Avatar from "~/components/Profile/Avatar";
import Name from "~/components/Profile/Name";
import Breadcrumbs from "~/components/utils/Breadcrumbs";
import withSignedInProtection from "~/hoc/withSignedInProtection";
import { api } from "~/utils/api";

export const Contest: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { data: contest } = api.contest.getBySlug.useQuery({ slug });
  const { data: entries } = api.contest.getEntriesByUser.useQuery({ 
    contestId: contest?.id || "",
  });

  console.log({ entries })

  if (contest) {
    return (
      <div className="px-2">
        <Breadcrumbs
          currentPaths={[
            `/contest/${slug}`,
          ]}
          currentPathNames={[
            contest.name,
          ]}
        />
        <h1 className="text-5xl font-bold mb-8">
          {contest?.name}
        </h1>
        <Link href={`/contest/${slug}/entry/create`} className="btn btn-primary">
          Log a Dog
        </Link>
        <ul>
          {entries?.map((entry) => (
            <li key={entry.createdById}>
              <div className="flex items-center gap-4">
                <div>{entry._sum.amount}</div>
                <Link href={`/profile/${entry.createdById}`} className="flex items-center gap-2">
                  <Avatar address={entry.createdById} />
                  <Name address={entry.createdById} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

export default withSignedInProtection(Contest);
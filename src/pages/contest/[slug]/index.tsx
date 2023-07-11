import { type NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

import Breadcrumbs from "~/components/utils/Breadcrumbs";
import withSignedInProtection from "~/hoc/withSignedInProtection";
import { api } from "~/utils/api";

export const Contest: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { data: contest } = api.contest.getBySlug.useQuery({ slug });

  if (contest) {
    return (
      <div>
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
      </div>
    );
  }
  return null;
}

export default withSignedInProtection(Contest);
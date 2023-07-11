import { type NextPage } from "next";
import { useRouter } from "next/router";

import Breadcrumbs from "~/components/utils/Breadcrumbs";
import withSignedInProtection from "~/hoc/withSignedInProtection";
import { api } from "~/utils/api";

export const CreateEntry: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { data: contest } = api.contest.getBySlug.useQuery({ slug });

  if (contest) {
    return (
      <div>
        <Breadcrumbs
          currentPaths={[
            `/contest/${slug}`,
            `/contest/${slug}/entry/create`
          ]}
          currentPathNames={[
            contest.name,
            "Log a Dog"
          ]}
        />
        <h1 className="text-5xl font-bold">
          Log a Dog
        </h1>
      </div>
    );
  }
  return null;
};

export default withSignedInProtection(CreateEntry);
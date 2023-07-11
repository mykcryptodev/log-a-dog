import { type NextPage } from "next";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

export const Contest: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { data: contest } = api.contest.getBySlug.useQuery({ slug });
  return (
    <div>
      <h1 className="text-7xl font-bold">
        {contest?.name}
      </h1>
    </div>
  )
}

export default Contest;
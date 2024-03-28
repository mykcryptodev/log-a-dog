import { type NextPage } from "next";
import { type GetServerSideProps } from "next";
import { useContext } from "react";
import ActiveChainContext from "~/contexts/ActiveChain";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { username } = context.params as { username: string };
  return {
    props: {
      username,
    },
  };
};

export const Profile: NextPage<{ username: string }> = ({ username }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { data, isLoading } = api.profile.getByUsername.useQuery({
    username,
    chainId: activeChain.id,
  }, {
    enabled: !!username,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading) return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">
            <div className="loading loading-spinner mr-2" />
            Loading...
          </h1>
        </div>
      </div>
    </main>
  )

  if (!data) return null;
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">{data?.username}</h1>
          <div>Start Date: 2022-01-01 00:00:00</div>
          <div>End Date: 2022-01-01 00:00:00</div>
        </div>
      </div>
    </main>
  );
};

export default Profile;
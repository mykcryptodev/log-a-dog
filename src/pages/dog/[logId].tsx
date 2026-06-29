import { type GetServerSideProps, type NextPage } from 'next';
import dynamic from 'next/dynamic';
import { MiniAppMeta } from "~/components/MiniAppMeta";
import { buildMiniAppEmbedMetadata } from "~/constants/miniapp";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { logId } = context.params as { logId: string };
  return { props: { logId } };
};

const DogPageComponent = dynamic(() => import('./DogPageComponent'), { ssr: false });

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const miniAppMetadata = buildMiniAppEmbedMetadata({
    imageUrl: `https://www.logadog.xyz/api/og/${logId}`,
    launchUrl: `https://www.logadog.xyz/dog/${logId}`,
  });

  return (
    <>
      <MiniAppMeta metadata={miniAppMetadata} />
      <DogPageComponent logId={logId} />
    </>
  );
};

export default DogPage;

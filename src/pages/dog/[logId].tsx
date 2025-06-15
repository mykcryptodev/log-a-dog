import { type GetServerSideProps, type NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from "next/head";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { logId } = context.params as { logId: string };
  return { props: { logId } };
};

const DogPageComponent = dynamic(() => import('./DogPageComponent'), { ssr: false });

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const miniAppMetadata = {
    version: "next",
    imageUrl: "https://yoink.party/framesV2/opengraph-image",
    button: {
      title: "🌭 Log a Dog",
      action: {
        type: "launch_frame",
        name: "Log a Dog",
        url: `https://logadog.xyz/dog/${logId}`,
        splashImageUrl: "https://logadog.xyz/images/logo.png",
        splashBackgroundColor: "#faf8f7",
      },
    },
  };

  return (
    <>
      <Head>
        <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
      </Head>
      <DogPageComponent logId={logId} />
    </>
  );
};

export default DogPage;

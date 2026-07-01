import { type GetServerSideProps, type NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from "next/head";
import { Seo, SITE_URL } from "~/components/utils/Seo";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { logId } = context.params as { logId: string };
  return { props: { logId } };
};

const DogPageComponent = dynamic(() => import('./DogPageComponent'), { ssr: false });

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const pageUrl = `${SITE_URL}/dog/${logId}`;
  // The dynamic OG image renders the actual hotdog being judged, branded with
  // the eater's username and dog count — this is the viral asset that shows
  // when the link is pasted into Twitter/Farcaster/iMessage.
  const imageUrl = `${SITE_URL}/api/og/${logId}`;

  const miniAppMetadata = {
    version: "next",
    imageUrl,
    button: {
      title: "🌭 Log a Dog",
      action: {
        type: "launch_frame",
        name: "Log a Dog",
        url: pageUrl,
        splashImageUrl: `${SITE_URL}/images/logo.png`,
        splashBackgroundColor: "#faf8f7",
      },
    },
  };

  return (
    <>
      <Seo
        title="This dog has been logged! 🌭"
        exactTitle
        description="Someone logged a hotdog onchain. Judge it VALID or SUS — then log your own and climb the leaderboard."
        image={imageUrl}
        imageWidth={1200}
        imageHeight={800}
        imageAlt="A hotdog logged on Log a Dog, awaiting judgment"
        url={pageUrl}
        type="article"
      />
      <Head>
        <meta name="fc:frame" content={JSON.stringify(miniAppMetadata)} />
      </Head>
      <DogPageComponent logId={logId} />
    </>
  );
};

export default DogPage;

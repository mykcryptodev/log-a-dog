import { type GetServerSideProps, type NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { MiniAppMeta } from "~/components/MiniAppMeta";
import { buildMiniAppEmbedMetadata } from "~/constants/miniapp";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { logId } = context.params as { logId: string };
  return { props: { logId } };
};

const DogPageComponent = dynamic(() => import('./DogPageComponent'), { ssr: false });

const DogPage: NextPage<{ logId: string }> = ({ logId }) => {
  const imageUrl = `https://www.logadog.xyz/api/og/${logId}`;
  const pageUrl = `https://www.logadog.xyz/dog/${logId}`;

  const miniAppMetadata = buildMiniAppEmbedMetadata({
    imageUrl,
    launchUrl: pageUrl,
  });

  return (
    <>
      {/* Per-dog Open Graph / Twitter card. Same keys as the _app defaults so
          these override them; Farcaster (fc:*) is handled by MiniAppMeta below
          and is unaffected. */}
      <Head>
        <meta key="ogurl" property="og:url" content={pageUrl} />
        <meta key="ogimage" property="og:image" content={imageUrl} />
        <meta key="ogimagew" property="og:image:width" content="1200" />
        <meta key="ogimageh" property="og:image:height" content="800" />
        <meta key="twurl" name="twitter:url" content={pageUrl} />
        <meta key="twimage" name="twitter:image" content={imageUrl} />
      </Head>
      <MiniAppMeta metadata={miniAppMetadata} />
      <DogPageComponent logId={logId} />
    </>
  );
};

export default DogPage;

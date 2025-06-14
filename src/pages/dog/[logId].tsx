import { type GetServerSideProps, type NextPage } from 'next';
import dynamic from 'next/dynamic';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { logId } = context.params as { logId: string };
  return { props: { logId } };
};

const DogPage = dynamic<NextPage<{ logId: string }>>(() => import('./DogPageComponent'), { ssr: false });

export default DogPage;

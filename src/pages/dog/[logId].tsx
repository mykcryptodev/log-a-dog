import { type GetServerSideProps, type NextPage } from 'next';
import dynamic from 'next/dynamic';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { logId } = context.params as { logId: string };
  return { props: { logId } };
};

const DogPage = dynamic(() => import('./DogPageComponent'), { ssr: true });

export default DogPage;

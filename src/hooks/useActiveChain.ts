import { DEFAULT_CHAIN } from '~/constants/chains';

const useActiveChain = () => {
  return {
    activeChain: DEFAULT_CHAIN,
  };
};

export default useActiveChain;

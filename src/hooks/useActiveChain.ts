import { useState } from 'react';
import { type Chain } from 'thirdweb';

import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from '~/constants/chains';

const useActiveChain = () => {
  const [activeChain, setActiveChain] = useState<Chain>(DEFAULT_CHAIN);

  const updateActiveChain = (chainIdOrName: number | string) => {
    const chainById = SUPPORTED_CHAINS.find(chain => chain.id === chainIdOrName);
    const chainByName = SUPPORTED_CHAINS.find(chain => chain.name === chainIdOrName);
    setActiveChain(chainById ?? chainByName ?? DEFAULT_CHAIN);
  }

  return {
    activeChain,
    updateActiveChain,
  }
}

export default useActiveChain;
import { Ethereum } from '@thirdweb-dev/chains';
import { useMemo,useState } from 'react';

import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from '~/constants/chain';

const useActiveChain = () => {
  const [activeChain, setActiveChain] = useState<string | number>(DEFAULT_CHAIN.chainId);

  const updateActiveChain = (chainName: string | number) => {
    setActiveChain(chainName);
  }

  const activeChainData = useMemo(() => {
    const chain = SUPPORTED_CHAINS.find(chain =>
      chain.chainId.toString() === activeChain.toString() || chain.slug === activeChain
    );
    if (!chain || !activeChain) return Ethereum;
    return chain;
  }, [activeChain]);

  return {
    activeChain,
    updateActiveChain,
    activeChainData
  }
}

export default useActiveChain;
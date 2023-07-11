import { type Chain} from "@thirdweb-dev/chains";
import { createContext } from "react";

import { DEFAULT_CHAIN } from "~/constants/chain";

type IActiveChainContext = {
  activeChain: string | number;
  activeChainData: Chain;
  updateActiveChain: (chainName: string) => void;
}
const defaultState = {
  activeChain: DEFAULT_CHAIN.chainId,
  activeChainData: DEFAULT_CHAIN,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateActiveChain: () => {},
}

const ActiveChainContext = createContext<IActiveChainContext>(defaultState);

export default ActiveChainContext;
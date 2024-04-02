import { type Chain} from "thirdweb/chains";
import { createContext } from "react";

import { DEFAULT_CHAIN } from "~/constants/chains";

type IActiveChainContext = {
  activeChain: Chain;
  updateActiveChain: (chainName: string | number) => void;
}
const defaultState = {
  activeChain: DEFAULT_CHAIN,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateActiveChain: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateActiveChainRpc: () => {},
}

const ActiveChainContext = createContext<IActiveChainContext>(defaultState);

export default ActiveChainContext;
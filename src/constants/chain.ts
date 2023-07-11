import { 
  Avalanche, 
  AvalancheFuji, 
  BaseGoerli,
  Binance, 
  BinanceTestnet, 
  CronosBeta,
  CronosTestnet, 
  Ethereum, 
  Goerli, 
  Mumbai,
  Polygon,
} from "@thirdweb-dev/chains";

export const SUPPORTED_CHAINS = [
  Ethereum,
  Goerli,
  Binance,
  BinanceTestnet,
  Avalanche,
  AvalancheFuji,
  CronosTestnet,
  CronosBeta,
  Polygon,
  Mumbai,
  BaseGoerli,
];

export const DEFAULT_CHAIN = Ethereum;

import { sepolia, baseSepolia } from "thirdweb/chains";
import { Sepolia, BaseSepoliaTestnet } from "@thirdweb-dev/chains"
 
export const SUPPORTED_CHAINS = [
  sepolia,
  baseSepolia,
];

export const LEGACY_SUPPORTED_CHAINS = [
  Sepolia,
  BaseSepoliaTestnet,
];

export const DEFAULT_CHAIN = baseSepolia;

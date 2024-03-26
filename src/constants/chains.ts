import { base, baseSepolia } from "thirdweb/chains";
 
export const SUPPORTED_CHAINS = [
  base,
  baseSepolia,
];

export const DEFAULT_CHAIN = process.env.NODE_ENV === "production" ? base : baseSepolia;

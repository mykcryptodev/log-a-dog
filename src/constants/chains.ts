import { base, baseSepolia } from "thirdweb/chains";
 
export const SUPPORTED_CHAINS = [
  base,
  baseSepolia,
];

export const DEFAULT_CHAIN = process.env.NODE_ENV === "production" ? base : baseSepolia;

export const MAX_PRIORITY_FEE_PER_GAS = {
  [base.id]: BigInt(555000),
  [baseSepolia.id]: undefined,
} as Record<number, bigint | undefined>;

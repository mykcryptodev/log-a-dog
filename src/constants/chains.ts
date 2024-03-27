import { base, baseSepolia } from "thirdweb/chains";
 
export const SUPPORTED_CHAINS = [
  base,
  baseSepolia,
];

export const DEFAULT_CHAIN = process.env.NODE_ENV === "production" ? {
  ...base,
  // rpc: "https://api.developer.coinbase.com/rpc/v1/base/A10WpgQTkaHJltNKqtNhT2RQ-E-KgEjs",
  rpc: "https://chain-proxy.wallet.coinbase.com?targetName=base",
} : {
  ...baseSepolia,
  // rpc: "https://api.developer.coinbase.com/rpc/v1/base-sepolia/Av-Z_3kkdy_jHZd62vCmczjEfXBPtJPC",
};

export const MAX_PRIORITY_FEE_PER_GAS = {
  [base.id]: BigInt(1110000),
  [baseSepolia.id]: undefined,
} as Record<number, bigint | undefined>;

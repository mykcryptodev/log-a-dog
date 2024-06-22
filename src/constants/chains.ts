import { base, baseSepolia } from "thirdweb/chains";
 
export const DEFAULT_CHAIN = process.env.NODE_ENV === "production" ? {
  ...base,
  rpc: "https://api.developer.coinbase.com/rpc/v1/base/A10WpgQTkaHJltNKqtNhT2RQ-E-KgEjs",
  // rpc: "https://chain-proxy.wallet.coinbase.com?targetName=base",
} : {
  ...baseSepolia,
  // rpc: "https://api.developer.coinbase.com/rpc/v1/base-sepolia/A10WpgQTkaHJltNKqtNhT2RQ-E-KgEjs",
};

export const SUPPORTED_CHAINS = [base, baseSepolia];
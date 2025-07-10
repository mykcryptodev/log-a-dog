import { base, baseSepolia } from "thirdweb/chains";
 
// export const DEFAULT_CHAIN = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development" ? {
//   ...baseSepolia,
//   // rpc: "https://api.developer.coinbase.com/rpc/v1/base/A10WpgQTkaHJltNKqtNhT2RQ-E-KgEjs",
//   // rpc: "https://chain-proxy.wallet.coinbase.com?targetName=base",
// } : {
//   ...base,
//   // rpc: "https://api.developer.coinbase.com/rpc/v1/base-sepolia/A10WpgQTkaHJltNKqtNhT2RQ-E-KgEjs",
// };

export const DEFAULT_CHAIN = base;

export const SUPPORTED_CHAINS = [base, baseSepolia];
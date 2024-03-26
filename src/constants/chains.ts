import { base, baseSepolia } from "thirdweb/chains";
 
export const SUPPORTED_CHAINS = [
  base,
  baseSepolia,
];

// TODO: go to Base on production when ready
export const DEFAULT_CHAIN = process.env.NODE_ENV === "production" ? baseSepolia : baseSepolia;

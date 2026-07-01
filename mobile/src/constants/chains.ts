import { base, baseSepolia } from "thirdweb/chains";
import { BASE_MAINNET_ID, BASE_SEPOLIA_ID } from "@shared/constants";
import { CHAIN_ID } from "~/constants";

export const SUPPORTED_CHAINS = [base, baseSepolia];

export function getActiveChain() {
  return CHAIN_ID === BASE_SEPOLIA_ID ? baseSepolia : base;
}

export { BASE_MAINNET_ID, BASE_SEPOLIA_ID };

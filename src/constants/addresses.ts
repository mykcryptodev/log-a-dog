/**
 * Re-export contract addresses from the shared data layer.
 * Web-specific thirdweb chain objects still live in ./chains.ts.
 */
export {
  LOG_A_DOG,
  STAKING_V1,
  STAKING,
  ATTESTATION_MANAGER_V1,
  ATTESTATION_MANAGER,
  HOTDOG_TOKEN,
  AIRDROP,
  AI_AFFIRMATION,
  EAS,
  EAS_SCHEMA_ID,
  EAS_AFFIMRATION_SCHEMA_ID,
  MODERATION_V1,
  MODERATION,
  CONTESTS,
  PROTOCOL_REWARDS,
  MAKER_WALLET,
  type ContractAddress,
} from "@shared/addresses";

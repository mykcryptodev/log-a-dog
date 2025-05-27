import { baseSepolia, base } from "thirdweb/chains";

type ContractAddress = Record<number, string>;

export const SMART_WALLET_FACTORY: ContractAddress = {
  [base.id]: "0x9153DbD27d9895BD1ca2839D2Dd0A7E68eE2e24f", // thirdweb
  // [base.id]: "0x9406Cc6185a346906296840746125a0E44976454", // coinbase
  [baseSepolia.id]: "0xc52d241baf9f2adf8f20105b13d044e5db3f736f",
}

export const SMART_WALLET_ENTRYPOINT: ContractAddress = {
  [base.id]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  [baseSepolia.id]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
}

export const SMART_WALLET_BUNDLER_URL: ContractAddress = {
  [base.id]: "https://api.developer.coinbase.com/rpc/v1/base/A10WpgQTkaHJltNKqtNhT2RQ-E-KgEjs",
  [baseSepolia.id]: "https://api.developer.coinbase.com/rpc/v1/base-sepolia/Av-Z_3kkdy_jHZd62vCmczjEfXBPtJPC",
}

export const LOG_A_DOG: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0x84e208988E8dcD30f70aC7bc560542568d331977",
}

export const STAKING: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0xFF629BCEDfa75F3B5cAbbD4E3DfcDB4f5c81fdEF",
}

export const ATTESTATION_MANAGER: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0x4AE2D410dd920365E6A3e3DdB19F8E5731d2704e",
}

export const HOTDOG_TOKEN: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0xd64d660f784e7042CB7d66b7a5f0484E0c771a5B",
}

export const AI_AFFIRMATION: ContractAddress = {
  [base.id]: "0xA473533c54D105C6334fE06c8624f7dfbb09ba25",
  [baseSepolia.id]: "0xA473533c54D105C6334fE06c8624f7dfbb09ba25",
}

export const EAS: ContractAddress = {
  [base.id]: "0x4200000000000000000000000000000000000021",
  [baseSepolia.id]: "0x4200000000000000000000000000000000000021",
}

export const EAS_SCHEMA_ID: ContractAddress = {
  [base.id]: "0x50acf16935a1112c80894722eaf5643ff82b96ff5dae5e2201df269d7c0b87f5",
  [baseSepolia.id]: "0x50acf16935a1112c80894722eaf5643ff82b96ff5dae5e2201df269d7c0b87f5",
}

export const EAS_AFFIMRATION_SCHEMA_ID: ContractAddress = {
  [base.id]: "0x978ab70659ff76860c1e5cc7c21d5c6c09c49a95747b00a155302cfe6d937d6c",
  [baseSepolia.id]: "0x978ab70659ff76860c1e5cc7c21d5c6c09c49a95747b00a155302cfe6d937d6c",
}

export const BETA_PROFILES: ContractAddress = {
  [base.id]: "0xFe1ba8d23414A80Eb1156dbEdcA7B300912F59c6",
  [baseSepolia.id]: "0x1A4C2C84bEF821bF3b18b2e85fc80523EC27eE16",
}

export const MODERATION_V1: ContractAddress = {
  [base.id]: "0xe24EA1E624983C510701Bb39b23005B21AE54a4F",
  [baseSepolia.id]: "0xB03F98Fd646CF9D454dd726AB0Ef2203D0D5CFf1",
}

export const MODERATION: ContractAddress = {
  [base.id]: "0x1DEa6DA299AEf3910BF9CBDdd00EdAEEf2631E58",
  [baseSepolia.id]: "0x22394188550a7e5b37485769F54653e3bC9c6674",
}

export const CONTESTS: ContractAddress = {
  [base.id]: "0x5F0CCD30CB0776b87b19A97AC4Bd589705d7CC33",
  [baseSepolia.id]: "0xF25668d782C79d9359e239931cE3Ff133a8B688C",
}
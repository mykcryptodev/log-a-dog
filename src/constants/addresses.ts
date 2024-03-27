import { baseSepolia, base } from "thirdweb/chains";

type ContractAddress = Record<number, string>;

export const SMART_WALLET_FACTORY: ContractAddress = {
  [base.id]: "0x9153DbD27d9895BD1ca2839D2Dd0A7E68eE2e24f",
  [baseSepolia.id]: "0xc52d241baf9f2adf8f20105b13d044e5db3f736f",
}

export const SMART_WALLET_ENTRYPOINT: ContractAddress = {
  [base.id]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  [baseSepolia.id]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
}

export const SMART_WALLET_BUNDLER_URL: ContractAddress = {
  [base.id]: "",
  [baseSepolia.id]: "https://api.developer.coinbase.com/rpc/v1/base-sepolia/Av-Z_3kkdy_jHZd62vCmczjEfXBPtJPC",
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

export const PROFILES: ContractAddress = {
  [base.id]: "0xFe1ba8d23414A80Eb1156dbEdcA7B300912F59c6",
  [baseSepolia.id]: "0x1A4C2C84bEF821bF3b18b2e85fc80523EC27eE16",
}

export const MODERATION: ContractAddress = {
  [base.id]: "0xe24EA1E624983C510701Bb39b23005B21AE54a4F",
  [baseSepolia.id]: "0xB03F98Fd646CF9D454dd726AB0Ef2203D0D5CFf1",
}

export const CONTESTS: ContractAddress = {
  [base.id]: "0x5F0CCD30CB0776b87b19A97AC4Bd589705d7CC33",
  [baseSepolia.id]: "0xF25668d782C79d9359e239931cE3Ff133a8B688C",
}
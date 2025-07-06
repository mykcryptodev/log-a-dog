import { baseSepolia, base } from "thirdweb/chains";

type ContractAddress = Record<number, string>;

export const LOG_A_DOG: ContractAddress = {
  [base.id]: "0x6CfB88C8d0d7FFC563155e13C62b4Fa17bc25974",
  [baseSepolia.id]: "0xa01Ee37F0A704221f5Bf3772a4207380090e1d32",
}

export const STAKING: ContractAddress = {
  [base.id]: "0x388aC132F45bB5d6810BC5a6412a14935a5B70D6",
  [baseSepolia.id]: "0x605150F6be3E9b81963Cd6d895b7C11D73e34874",
}

export const ATTESTATION_MANAGER: ContractAddress = {
  [base.id]: "0xcBf054aA8FEb4fd0484E45b766B502Bc045076B8",
  [baseSepolia.id]: "0xC6073175c71Bd69dBb42aB92e024DD31BEE81f3A",
}

export const HOTDOG_TOKEN: ContractAddress = {
  [base.id]: "0x61f47EC6D1d0ef9b095574D7b76cF0467d13fB07",
  [baseSepolia.id]: "0x113F2c74d66A5eFc1F114547cA97f6a1b62b0Bd8",
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
export const PROTOCOL_REWARDS: ContractAddress = {
  [base.id]: "0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B",
  [baseSepolia.id]: "0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B",
}

export const MAKER_WALLET = "0x9622D04739a54313e3B057051Ea42DafBE4fbd4f" as `0x${string}`


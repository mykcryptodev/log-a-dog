import { baseSepolia, base } from "thirdweb/chains";

type ContractAddress = Record<number, string>;

export const LOG_A_DOG: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0x5D9A90b707c144D350A50e2628e94101013d76D1",
}

export const STAKING: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0x729e681F419A780755476c75c3598446025017B4",
}

export const ATTESTATION_MANAGER: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0xe900720fdF8aBF69Ba275CAeFA85288436DDb277",
}

export const HOTDOG_TOKEN: ContractAddress = {
  [base.id]: "0x82f276C283948b81f17EA5A98906Bd3159ccf4F5",
  [baseSepolia.id]: "0x29B85652461088Fe89Db817C6C0e163A5589a96e",
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
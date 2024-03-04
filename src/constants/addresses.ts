import { sepolia, baseSepolia } from "thirdweb/chains";

type ContractAddress = Record<number, string>;

export const SMART_WALLET_FACTORY: ContractAddress = {
  [baseSepolia.id]: '0xc52d241baf9f2adf8f20105b13d044e5db3f736f',
  [sepolia.id]: '0xc52d241baf9f2adf8f20105b13d044e5db3f736f',
}

export const EAS: ContractAddress = {
  [baseSepolia.id]: "0x4200000000000000000000000000000000000021",
  [sepolia.id]: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
}

export const EAS_SCHEMA_ID: ContractAddress = {
  [baseSepolia.id]: "0x7be7e2f8a4642f6164331217da4793255d6687b9aac8252adb9c11d0640e043e",
  [sepolia.id]: "0x70f012660a0e3aff1cbd3ecf2662062d725ef436d73f66200a2f612537d167d7",
}

export const PROFILES: ContractAddress = {
  [baseSepolia.id]: "0x4D0d732777B677b194A49AE8DED8A9374Cc14117",
}

export const MODERATION: ContractAddress = {
  [baseSepolia.id]: "0xB03F98Fd646CF9D454dd726AB0Ef2203D0D5CFf1",
}

export const CONTESTS: ContractAddress = {
  [baseSepolia.id]: "0xa34Fee979C734425EF137974Ca00005c7a537766",
}
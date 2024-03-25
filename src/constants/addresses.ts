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
  // [baseSepolia.id]: "0x7be7e2f8a4642f6164331217da4793255d6687b9aac8252adb9c11d0640e043e",
  [baseSepolia.id]: "0x66d64054922501f25a33e90672a4366c2d4015b8ba06a2f9c11ccd3a6a07894e",
  [sepolia.id]: "0x70f012660a0e3aff1cbd3ecf2662062d725ef436d73f66200a2f612537d167d7",
}

export const EAS_AFFIMRATION_SCHEMA_ID: ContractAddress = {
  [baseSepolia.id]: "0x978ab70659ff76860c1e5cc7c21d5c6c09c49a95747b00a155302cfe6d937d6c",
}

export const PROFILES: ContractAddress = {
  // [baseSepolia.id]: "0x4D0d732777B677b194A49AE8DED8A9374Cc14117",
  [baseSepolia.id]: "0x1A4C2C84bEF821bF3b18b2e85fc80523EC27eE16",
}

export const MODERATION: ContractAddress = {
  [baseSepolia.id]: "0xB03F98Fd646CF9D454dd726AB0Ef2203D0D5CFf1",
}

export const CONTESTS: ContractAddress = {
  [baseSepolia.id]: "0x4b7bC8173d6668f672129705F0D23547a95aAF53",
}
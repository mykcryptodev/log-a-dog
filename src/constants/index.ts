import { base, baseSepolia } from "thirdweb/chains";

type ProjectId = Record<number, string>;
export const COINBASE_WAAS_PROJECT_ID: ProjectId = {
  [baseSepolia.id]: "9418738b-c109-4db5-9ac0-3333e0aabbe9",
  [base.id]: "d5c9dcbc-0f56-418c-8ca8-8e3081fbb2bf",
};
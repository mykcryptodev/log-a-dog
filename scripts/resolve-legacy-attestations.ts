/**
 * One-shot script: resolve all still-active attestation periods in ATTESTATION_MANAGER_V1
 * for a given user address, which unlocks their tokens in STAKING_V1.
 *
 * Usage:
 *   USER=0x653Ff253b0c7C1cc52f484e891b71f9f1F010Bfb bunx tsx scripts/resolve-legacy-attestations.ts
 *
 * Requires: THIRDWEB_SECRET_KEY, NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS,
 *           THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN in .env
 */

import { config as loadEnv } from "dotenv";
loadEnv();

import { createThirdwebClient, Engine, getContract, readContract } from "thirdweb";
import { base } from "thirdweb/chains";
import {
  getUserAttestations,
  getAttestationPeriod,
  resolveAttestationPeriod,
} from "../src/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";

const USER = process.env.USER_ADDR ?? "0x653Ff253b0c7C1cc52f484e891b71f9f1F010Bfb";
const ATTESTATION_MANAGER_V1 = "0xcBf054aA8FEb4fd0484E45b766B502Bc045076B8";

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

const serverWallet = Engine.serverWallet({
  client,
  address: process.env.NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS as `0x${string}`,
  vaultAccessToken: process.env.THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN!,
});

const attestationV1Contract = getContract({
  address: ATTESTATION_MANAGER_V1,
  client,
  chain: base,
});

async function main() {
  console.log(`Checking attestations for ${USER} on ATTESTATION_MANAGER_V1 (${ATTESTATION_MANAGER_V1})`);

  const logIds = await getUserAttestations({
    contract: attestationV1Contract,
    user: USER as `0x${string}`,
  });

  console.log(`Found ${logIds.length} attestation log IDs: ${logIds.map(String).join(", ")}`);

  const now = BigInt(Math.floor(Date.now() / 1000));
  let resolved = 0;
  let skipped = 0;

  for (const logId of logIds) {
    let period;
    try {
      period = await getAttestationPeriod({ contract: attestationV1Contract, logId });
    } catch {
      console.log(`  logId ${logId}: no attestation period on-chain, skipping`);
      skipped++;
      continue;
    }

    const [startTime, endTime, status] = period;
    // status 0 = Active, 1 = Resolved
    if (Number(status) === 1) {
      console.log(`  logId ${logId}: already resolved, skipping`);
      skipped++;
      continue;
    }

    if (now < endTime) {
      console.log(`  logId ${logId}: attestation period still active (ends ${new Date(Number(endTime) * 1000).toISOString()}), skipping`);
      skipped++;
      continue;
    }

    console.log(`  logId ${logId}: resolving (started ${new Date(Number(startTime) * 1000).toISOString()}, ended ${new Date(Number(endTime) * 1000).toISOString()})`);

    const tx = resolveAttestationPeriod({ contract: attestationV1Contract, logId });
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction: tx });
    console.log(`    -> enqueued txId: ${transactionId}`);
    resolved++;

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nDone. Resolved: ${resolved}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

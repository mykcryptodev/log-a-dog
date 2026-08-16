/**
 * Doctor / setup for the gasless logging sponsor.
 *
 * Sponsored logging silently degrades: when the sponsor is misconfigured the app
 * keeps working and just bills users for their own gas. This script makes the
 * state explicit — it derives the sponsor address from the configured key, and
 * checks the two things that must both be true for the relay to fire:
 * OPERATOR_ROLE on LogADog, and enough Base ETH to pay for logs.
 *
 * Usage:
 *   # Read-only report (safe, sends nothing):
 *   bunx tsx scripts/setup-gasless-sponsor.ts
 *
 *   # Grant OPERATOR_ROLE to the sponsor, signed by the contract admin:
 *   bunx tsx scripts/setup-gasless-sponsor.ts --grant
 *
 * Requires in .env: THIRDWEB_SECRET_KEY, LOGADOG_SPONSOR_PK (or
 * LOGADOG_KEEPER_PK). --grant additionally needs ADMIN_PRIVATE_KEY, whose
 * address must hold DEFAULT_ADMIN_ROLE (the account that deployed LogADog).
 */

import { config as loadEnv } from "dotenv";
loadEnv();

import { createThirdwebClient, getContract, sendTransaction } from "thirdweb";
import { base } from "thirdweb/chains";
import { getWalletBalance, privateKeyToAccount } from "thirdweb/wallets";
import type { Account } from "thirdweb/wallets";
import {
  addOperator,
  DEFAULT_ADMIN_ROLE,
  hasRole,
  OPERATOR_ROLE,
} from "../src/thirdweb/8453/0x6cfb88c8d0d7ffc563155e13c62b4fa17bc25974";

const LOG_A_DOG = "0x6CfB88C8d0d7FFC563155e13C62b4Fa17bc25974";

/** Roughly what one log costs on Base, measured from a real logHotdog tx. */
const APPROX_GAS_PER_LOG_WEI = 11_000_000_000_000n;

/** Same normalisation as src/server/utils/sponsor.ts — accept bare or 0x keys. */
function toPrivateKey(raw: string): `0x${string}` {
  return `0x${raw.replace(/^0x/, "")}`;
}

async function main() {
  const shouldGrant = process.argv.includes("--grant");

  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  if (!secretKey) throw new Error("THIRDWEB_SECRET_KEY is not set");
  const client = createThirdwebClient({ secretKey });

  const contract = getContract({ address: LOG_A_DOG, chain: base, client });

  // 1. Which key is the server actually going to sign with?
  const sponsorKey = process.env.LOGADOG_SPONSOR_PK ?? process.env.LOGADOG_KEEPER_PK;
  if (!sponsorKey) {
    console.error(
      "✗ Neither LOGADOG_SPONSOR_PK nor LOGADOG_KEEPER_PK is set — sponsored logging is off\n" +
        "  Set LOGADOG_SPONSOR_PK to the private key of a funded EOA, then re-run.",
    );
    process.exit(1);
  }
  const usingKeeperFallback = !process.env.LOGADOG_SPONSOR_PK;

  let sponsor: Account;
  try {
    sponsor = privateKeyToAccount({ client, privateKey: toPrivateKey(sponsorKey) });
  } catch (error) {
    console.error("✗ The configured sponsor key is not a valid private key:", error);
    process.exit(1);
  }

  console.log(`Contract : ${LOG_A_DOG} (Base mainnet)`);
  console.log(`Sponsor  : ${sponsor.address}`);
  if (usingKeeperFallback) {
    console.log(
      "  note: LOGADOG_SPONSOR_PK is unset, so this fell back to LOGADOG_KEEPER_PK.\n" +
        "  That key also signs the hourly resolve cron, outside the relay's nonce lock —\n" +
        "  a dedicated LOGADOG_SPONSOR_PK avoids the two colliding on a nonce.",
    );
  }

  // 2. Can it call logHotdogOnBehalf?
  const operatorRole = await OPERATOR_ROLE({ contract });
  let isOperator = await hasRole({
    contract,
    role: operatorRole,
    account: sponsor.address,
  });
  console.log(
    `OPERATOR_ROLE: ${isOperator ? "✓ granted" : "✗ MISSING — every log falls back to the user's wallet"}`,
  );

  // 3. Can it pay?
  const balance = await getWalletBalance({
    address: sponsor.address,
    client,
    chain: base,
  });
  const logsAffordable = balance.value / APPROX_GAS_PER_LOG_WEI;
  console.log(
    `Balance  : ${balance.displayValue} ETH (~${logsAffordable} more logs at current rates)`,
  );

  if (!isOperator && shouldGrant) {
    const adminKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminKey) {
      console.error("\n✗ --grant needs ADMIN_PRIVATE_KEY in .env");
      process.exit(1);
    }
    const admin = privateKeyToAccount({ client, privateKey: toPrivateKey(adminKey) });

    // addOperator is onlyRole(DEFAULT_ADMIN_ROLE); check before spending gas on
    // a guaranteed revert, and so a wrong key is reported as a wrong key.
    const adminRole = await DEFAULT_ADMIN_ROLE({ contract });
    const isAdmin = await hasRole({
      contract,
      role: adminRole,
      account: admin.address,
    });
    if (!isAdmin) {
      console.error(
        `\n✗ ADMIN_PRIVATE_KEY (${admin.address}) does not hold DEFAULT_ADMIN_ROLE on LogADog.\n` +
          "  That role belongs to whichever account deployed the contract — use that key.",
      );
      process.exit(1);
    }

    console.log(`\nGranting OPERATOR_ROLE to ${sponsor.address} as admin ${admin.address}…`);
    const { transactionHash } = await sendTransaction({
      account: admin,
      transaction: addOperator({ contract, operator: sponsor.address }),
    });
    console.log(`  tx: https://basescan.org/tx/${transactionHash}`);

    isOperator = await hasRole({
      contract,
      role: operatorRole,
      account: sponsor.address,
    });
    console.log(`  OPERATOR_ROLE now: ${isOperator ? "✓ granted" : "✗ still missing"}`);
  }

  // 4. What's left?
  const todo: string[] = [];
  if (!isOperator) {
    todo.push(
      "Grant OPERATOR_ROLE — re-run with --grant, or call addOperator(" +
        `${sponsor.address}) from the DEFAULT_ADMIN_ROLE account.`,
    );
  }
  if (balance.value < APPROX_GAS_PER_LOG_WEI * 100n) {
    todo.push(`Fund ${sponsor.address} with Base ETH (0.01 ETH covers ~900 logs).`);
  }
  if (process.env.NEXT_PUBLIC_LOGADOG_SPONSOR_ADDRESS?.toLowerCase() !== sponsor.address.toLowerCase()) {
    todo.push(
      `Set NEXT_PUBLIC_LOGADOG_SPONSOR_ADDRESS=${sponsor.address} so the feed hides ` +
        'the "via" byline on relayed logs (optional — the client asks the server otherwise).',
    );
  }

  if (todo.length === 0) {
    console.log("\n✓ Sponsored logging is ready. Redeploy if you just changed env vars.");
  } else {
    console.log("\nStill to do:");
    todo.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

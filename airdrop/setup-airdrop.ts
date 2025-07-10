import { createThirdwebClient, getContract, sendAndConfirmTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { setMerkleRoot } from "thirdweb/extensions/airdrop";
import { base, baseSepolia } from "thirdweb/chains";
import { AIRDROP, HOTDOG_TOKEN } from "../src/constants/addresses";
import { setupAirdropMerkleTree } from "../src/helpers/merkleProofs";
import { AIRDROP_CSV_DATA } from "./airdrop";
import * as readline from 'readline';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

// Function to securely prompt for private key
function promptForPrivateKey(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Hide input for private key (though it will still be visible in most terminals)
    console.log('🔐 Please enter your admin wallet private key:');
    console.log('⚠️  Make sure you trust this environment - the key will be visible while typing');
    
    rl.question('Private Key (0x...): ', (privateKey) => {
      rl.close();
      resolve(privateKey.trim());
    });
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const chainArg = args.find(arg => arg.startsWith('--chain='))?.split('=')[1];

// Determine chain
const getChain = (chainName?: string) => {
  switch (chainName?.toLowerCase()) {
    case 'base':
    case 'mainnet':
      return base;
    case 'basesepolia':
    case 'sepolia':
    case 'testnet':
      return baseSepolia;
    default:
      console.log(`Using default chain: ${baseSepolia.name}`);
      return baseSepolia;
  }
};

const CHAIN = getChain(chainArg);
const AIRDROP_CONTRACT_ADDRESS = AIRDROP[CHAIN.id];
const TOKEN_ADDRESS = HOTDOG_TOKEN[CHAIN.id];

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
HOTDOG Airdrop Setup Script

This script:
1. Generates merkle tree from CSV data
2. Saves snapshot to contract metadata 
3. Sets merkle root on the airdrop contract

Usage:
  tsx airdrop/setup-airdrop.ts [--chain=<chain>]

Options:
  --chain=<chain>    Target chain (base, baseSepolia, testnet, mainnet)
  --help, -h         Show this help message

Environment Variables Required:
  THIRDWEB_SECRET_KEY    Your thirdweb secret key

Note: You will be prompted for your admin wallet private key when running the script.

Examples:
  tsx airdrop/setup-airdrop.ts --chain=baseSepolia
  tsx airdrop/setup-airdrop.ts --chain=base
  npm run script:setup-airdrop -- --chain=baseSepolia

Default: baseSepolia (testnet)
`);
  process.exit(0);
}

async function setupAirdrop() {
  // Validate environment variables
  if (!THIRDWEB_SECRET_KEY) {
    throw new Error("THIRDWEB_SECRET_KEY is required in .env file");
  }
  
  // Prompt for admin private key
  const adminPrivateKey = await promptForPrivateKey();
  
  if (!adminPrivateKey.startsWith('0x')) {
    throw new Error("Private key must start with '0x'");
  }

  // Validate contract addresses
  if (!AIRDROP_CONTRACT_ADDRESS) {
    throw new Error(`Airdrop contract address not found for chain ${CHAIN.name} (ID: ${CHAIN.id})`);
  }
  
  if (!TOKEN_ADDRESS) {
    throw new Error(`HOTDOG token address not found for chain ${CHAIN.name} (ID: ${CHAIN.id})`);
  }

  console.log("🚀 Setting up HOTDOG airdrop...");
  console.log(`Chain: ${CHAIN.name} (ID: ${CHAIN.id})`);
  console.log(`Airdrop Contract: ${AIRDROP_CONTRACT_ADDRESS}`);
  console.log(`HOTDOG Token: ${TOKEN_ADDRESS}`);

  // Create thirdweb client and account
  const client = createThirdwebClient({
    secretKey: THIRDWEB_SECRET_KEY,
  });

  const account = privateKeyToAccount({
    client,
    privateKey: adminPrivateKey as `0x${string}`,
  });

  console.log(`Admin Account: ${account.address}`);

  try {
    // Step 1: Generate merkle tree and prepare save snapshot transaction
    console.log("\n📋 Step 1: Generating merkle tree and preparing snapshot...");
    const { merkleRoot, snapshotUri, snapshot, saveSnapshotTx } = await setupAirdropMerkleTree(AIRDROP_CSV_DATA);

    console.log(`Generated merkle root: ${merkleRoot}`);
    console.log(`Snapshot URI: ${snapshotUri}`);
    console.log(`Total recipients: ${snapshot.length}`);

    // Step 2: Send save snapshot transaction
    console.log("\n📤 Step 2: Saving snapshot to contract metadata...");
    const saveSnapshotResult = await sendAndConfirmTransaction({
      account,
      transaction: saveSnapshotTx,
    });
    
    console.log("✅ Snapshot saved successfully!");
    console.log(`Transaction hash: ${saveSnapshotResult.transactionHash}`);

    // Step 3: Set merkle root
    console.log("\n🌳 Step 3: Setting merkle root...");
    const contract = getContract({
      client,
      chain: CHAIN,
      address: AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
    });

    const setMerkleRootTx = setMerkleRoot({
      contract,
      resetClaimStatus: true,
      token: TOKEN_ADDRESS as `0x${string}`,
      tokenMerkleRoot: merkleRoot as `0x${string}`,
    });

    const setMerkleRootResult = await sendAndConfirmTransaction({
      account,
      transaction: setMerkleRootTx,
    });

    console.log("✅ Merkle root set successfully!");
    console.log(`Transaction hash: ${setMerkleRootResult.transactionHash}`);

    // Success summary
    console.log("\n🎉 Airdrop setup complete!");
    console.log("📊 Summary:");
    console.log(`- Merkle Root: ${merkleRoot}`);
    console.log(`- Snapshot URI: ${snapshotUri}`);
    console.log(`- Total Recipients: ${snapshot.length}`);
    console.log(`- Save Snapshot Tx: ${saveSnapshotResult.transactionHash}`);
    console.log(`- Set Merkle Root Tx: ${setMerkleRootResult.transactionHash}`);
    console.log("\n✅ Users can now claim their airdrop tokens!");

    // Save results to file
    const fs = await import('fs');
    const path = await import('path');
    const results = {
      chainId: CHAIN.id,
      chainName: CHAIN.name,
      contractAddress: AIRDROP_CONTRACT_ADDRESS,
      tokenAddress: TOKEN_ADDRESS,
      merkleRoot,
      snapshotUri,
      totalRecipients: snapshot.length,
      saveSnapshotTx: saveSnapshotResult.transactionHash,
      setMerkleRootTx: setMerkleRootResult.transactionHash,
      setupAt: new Date().toISOString(),
    };

    const filename = `airdrop-setup-${CHAIN.id}-${Date.now()}.json`;
    const filepath = path.join('airdrop', filename);
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`\n📁 Setup results saved to: ${filepath}`);

  } catch (error) {
    console.error("❌ Airdrop setup failed:", error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAirdrop()
    .then(() => {
      console.log("\n🎉 Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { setupAirdrop }; 
import { createThirdwebClient, getContract, toTokens } from "thirdweb";
import { generateMerkleTreeInfoERC20 } from "thirdweb/extensions/airdrop";
import { base, baseSepolia } from "thirdweb/chains";
import { AIRDROP, HOTDOG_TOKEN } from "../src/constants/addresses";

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

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
      console.log(`Using default chain: ${base.name}`);
      return base;
  }
};

const CHAIN = getChain(chainArg);
const tokenAddress = HOTDOG_TOKEN[CHAIN.id];
const AIRDROP_CONTRACT_ADDRESS = AIRDROP[CHAIN.id];

// Validate token address exists
if (!tokenAddress) {
  throw new Error(`HOTDOG token address not found for chain ${CHAIN.name} (ID: ${CHAIN.id})`);
}

const TOKEN_ADDRESS = tokenAddress;

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
HOTDOG Token Merkle Root Generator

Usage:
  tsx airdrop/generate-merkle-root.ts [--chain=<chain>]

Options:
  --chain=<chain>    Target chain (base, baseSepolia, testnet, mainnet)
  --help, -h         Show this help message

Examples:
  tsx airdrop/generate-merkle-root.ts --chain=base
  tsx airdrop/generate-merkle-root.ts --chain=baseSepolia
  tsx airdrop/generate-merkle-root.ts --chain=testnet
  npm run script:generate-merkle -- --chain=base

Supported chains:
  - base (mainnet)
  - baseSepolia (testnet)
  - testnet (alias for baseSepolia)
  - mainnet (alias for base)

Default: base (mainnet)
`);
  process.exit(0);
}

async function generateMerkleRoot() {
  // Validate environment variables
  if (!THIRDWEB_SECRET_KEY) {
    throw new Error("THIRDWEB_SECRET_KEY is required in .env file");
  }

  // Create thirdweb client
  const client = createThirdwebClient({
    secretKey: THIRDWEB_SECRET_KEY,
  });

  // Get the airdrop contract
  const contract = getContract({
    client,
    chain: CHAIN,
    address: AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
  });

  // Load snapshot from CSV file
  console.log("Loading recipient data from CSV file...");
  const snapshot = await loadSnapshotFromCSV('airdrop/airdrop.csv');

  console.log("Generating merkle tree for HOTDOG token airdrop...");
  console.log(`Total recipients: ${snapshot.length}`);
  console.log(`Chain: ${CHAIN.name} (ID: ${CHAIN.id})`);
  console.log(`Contract Address: ${AIRDROP_CONTRACT_ADDRESS}`);
  console.log(`HOTDOG Token Address: ${TOKEN_ADDRESS}`);

  try {
    const { merkleRoot, snapshotUri } = await generateMerkleTreeInfoERC20({
      contract,
      tokenAddress: TOKEN_ADDRESS,
      snapshot,
    });

    console.log("\n✅ Merkle tree generated successfully!");
    console.log(`Merkle Root: ${merkleRoot}`);
    console.log(`Snapshot URI: ${snapshotUri}`);

    const total = snapshot.reduce((sum, item) => sum + item.amount, 0);

    // Save results to file
    const results = {
      merkleRoot,
      snapshotUri,
      snapshot,
      metadata: {
        chainId: CHAIN.id,
        chainName: CHAIN.name,
        contractAddress: AIRDROP_CONTRACT_ADDRESS,
        tokenAddress: TOKEN_ADDRESS,
        totalRecipients: snapshot.length,
        totalAmount: total.toString() + " tokens",
        generatedAt: new Date().toISOString(),
      },
    };

    const fs = await import('fs');
    const path = await import('path');
    const filename = `merkle-tree-${Date.now()}.json`;
    const filepath = path.join('airdrop', filename);
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: ${filepath}`);

  } catch (error) {
    console.error("❌ Error generating merkle tree:", error);
    throw error;
  }
}

// Function to load snapshot from CSV file (thirdweb format)
async function loadSnapshotFromCSV(csvPath: string): Promise<Array<{ recipient: string; amount: number }>> {
  const fs = await import('fs');
  const csvParser = await import('csv-parser' as any);
  
  const results: Array<{ recipient: string; amount: number }> = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser.default())
      .on('data', (data: any) => {
        const humanReadableAmount = data.amount || "0";
        // Clean the amount string and keep as token amount (not wei)
        const cleanAmount = humanReadableAmount.toString().trim();
        results.push({
          recipient: data.address, // Use 'address' column from CSV
          amount: parseFloat(cleanAmount), // Keep as token amount, thirdweb handles wei conversion
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', reject);
  });
}

// Example function to load snapshot from JSON file
async function loadSnapshotFromJSON(jsonPath: string) {
  const fs = await import('fs');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  return data.snapshot || data;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMerkleRoot()
    .then(() => {
      console.log("\n🎉 Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { generateMerkleRoot, loadSnapshotFromCSV, loadSnapshotFromJSON }; 
import { toUnits } from "thirdweb/utils";
import { createThirdwebClient, getContract } from "thirdweb";
import { generateMerkleTreeInfoERC20 } from "thirdweb/extensions/airdrop";
import { getContractMetadata, setContractURI } from "thirdweb/extensions/common";
import { upload } from "thirdweb/storage";
import { DEFAULT_CHAIN } from "~/constants/chains";
import { AIRDROP, HOTDOG_TOKEN } from "../constants/addresses";
import { client } from "~/providers/Thirdweb";

// Types matching thirdweb's official format
interface SnapshotEntry {
  recipient: string;
  amount: number; // Amount in tokens (not wei)
}

interface SaveSnapshotParams {
  merkleRoot: string;
  snapshotUri: string;
}

// Parse CSV data to thirdweb's snapshot format
function parseCSVData(csvData: string): SnapshotEntry[] {
  const lines = csvData.trim().split('\n');
  const entries: SnapshotEntry[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    
    const parts = line.split(',');
    const address = parts[0]?.trim();
    const amount = parts[1]?.trim();
    
    if (address && amount) {
      entries.push({
        recipient: address,
        amount: parseFloat(amount), // Keep as token amount, not wei
      });
    }
  }
  
  return entries;
}

// Save snapshot to contract metadata (replicating thirdweb's saveSnapshot)
export async function saveSnapshot(merkleRoot: string, snapshotUri: string) {
  const contract = getContract({
    client,
    chain: DEFAULT_CHAIN,
    address: AIRDROP[DEFAULT_CHAIN.id] as `0x${string}`,
  });

  try {
    console.log("📤 Saving snapshot to contract metadata...");
    
    // Get current contract metadata
    const metadata = await getContractMetadata({ contract });
    console.log("📋 Current metadata:", metadata);
    
    // Create merkle infos object
    const merkleInfos: Record<string, string> = {};
    
    // Add the new merkle root
    merkleInfos[merkleRoot] = snapshotUri;
    
    // Keep old merkle roots from other tokenIds
    if (metadata.merkle) {
      for (const key of Object.keys(metadata.merkle)) {
        merkleInfos[key] = metadata.merkle[key];
      }
    }
    
    // Merge with existing metadata
    const mergedMetadata = {
      ...metadata,
      merkle: merkleInfos,
    };
    
    console.log("🔗 Merged metadata:", mergedMetadata);
    
    // Upload updated metadata to IPFS
    const uri = await upload({
      client,
      files: [mergedMetadata],
    });
    
    console.log("📁 Uploaded metadata URI:", uri);
    
    // Return transaction to set contract URI
    return setContractURI({
      contract,
      uri,
    });
    
  } catch (error) {
    console.error("❌ Error saving snapshot:", error);
    throw error;
  }
}

// Generate merkle tree using thirdweb's official method
export async function generateOfficialMerkleTree(csvData: string): Promise<{
  merkleRoot: string;
  snapshotUri: string;
  snapshot: SnapshotEntry[];
}> {
  const snapshot = parseCSVData(csvData);
  
  // Get the airdrop contract
  const contract = getContract({
    client,
    chain: DEFAULT_CHAIN,
    address: AIRDROP[DEFAULT_CHAIN.id] as `0x${string}`,
  });

  try {
    // Use thirdweb's official merkle tree generation
    const { merkleRoot, snapshotUri } = await generateMerkleTreeInfoERC20({
      contract,
      tokenAddress: HOTDOG_TOKEN[DEFAULT_CHAIN.id] as `0x${string}`,
      snapshot,
    });

    console.log("🌳 Official thirdweb merkle tree generated:");
    console.log("- Merkle Root:", merkleRoot);
    console.log("- Snapshot URI:", snapshotUri);
    console.log("- Total recipients:", snapshot.length);

    return { merkleRoot, snapshotUri, snapshot };
  } catch (error) {
    console.error("❌ Error generating official merkle tree:", error);
    throw error;
  }
}

// Complete setup: generate merkle tree and save to contract
export async function setupAirdropMerkleTree(csvData: string) {
  console.log("🚀 Starting complete airdrop setup...");
  
  try {
    // Step 1: Generate merkle tree
    const { merkleRoot, snapshotUri, snapshot } = await generateOfficialMerkleTree(csvData);
    
    // Step 2: Save snapshot to contract metadata
    const saveSnapshotTx = await saveSnapshot(merkleRoot, snapshotUri);
    
    console.log("✅ Setup complete! Next steps:");
    console.log("1. Send the saveSnapshot transaction to update contract metadata");
    console.log("2. Call setMerkleRoot on the contract with the merkle root");
    console.log("3. Users can then claim using the claimERC20 function");
    
    return {
      merkleRoot,
      snapshotUri,
      snapshot,
      saveSnapshotTx,
    };
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
}

// Check if address is eligible for airdrop
export function isAddressEligible(csvData: string, address: string): boolean {
  const snapshot = parseCSVData(csvData);
  return snapshot.some(entry => 
    entry.recipient.toLowerCase() === address.toLowerCase()
  );
}

// Get amount for address
export function getAmountForAddress(csvData: string, address: string): number {
  const snapshot = parseCSVData(csvData);
  const entry = snapshot.find(entry => 
    entry.recipient.toLowerCase() === address.toLowerCase()
  );
  return entry?.amount || 0;
}

// Debug function for testing
export async function debugOfficialMerkleTree(csvData: string): Promise<void> {
  console.log("🔧 Starting official merkle tree debug...");
  
  try {
    const { merkleRoot, snapshotUri, snapshot } = await generateOfficialMerkleTree(csvData);
    
    console.log("✅ Official Merkle Tree Debug Info:");
    console.log("- Merkle Root:", merkleRoot);
    console.log("- Snapshot URI:", snapshotUri);
    console.log("- Total Recipients:", snapshot.length);
    console.log("- Sample entries:", snapshot.slice(0, 3));
    
    // Test a specific address
    const testAddress = "0x445664D66C294F49bb55A90d3c30BCAB0F9502A9";
    const isEligible = isAddressEligible(csvData, testAddress);
    const amount = getAmountForAddress(csvData, testAddress);
    
    console.log(`- Test address ${testAddress}:`);
    console.log(`  - Eligible: ${isEligible}`);
    console.log(`  - Amount: ${amount} tokens`);
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

export { type SnapshotEntry }; 
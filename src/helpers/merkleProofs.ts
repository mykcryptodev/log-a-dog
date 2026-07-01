import { getContract } from "thirdweb";
import { generateMerkleTreeInfoERC20 } from "thirdweb/extensions/airdrop";
import { getContractMetadata, setContractURI } from "thirdweb/extensions/common";
import { upload } from "thirdweb/storage";
import { DEFAULT_CHAIN } from "~/constants/chains";
import { AIRDROP, HOTDOG_TOKEN } from "../constants/addresses";
import { client } from "~/providers/Thirdweb";
import {
  parseAirdropCsv,
  isAddressEligible,
  getAmountForAddress,
  type SnapshotEntry,
} from "@shared/merkle";

export {
  isAddressEligible,
  getAmountForAddress,
  parseAirdropCsv,
  type SnapshotEntry,
} from "@shared/merkle";

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (metadata.merkle) {
      const existingMerkle = metadata.merkle as Record<string, string>;
      for (const key of Object.keys(existingMerkle)) {
        merkleInfos[key] = existingMerkle[key]!;
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
  const snapshot = parseAirdropCsv(csvData);
  
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
    const eligible = isAddressEligible(csvData, testAddress);
    const amount = getAmountForAddress(csvData, testAddress);
    
    console.log(`- Test address ${testAddress}:`);
    console.log(`  - Eligible: ${eligible}`);
    console.log(`  - Amount: ${amount} tokens`);
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

# HOTDOG Token Merkle Root Generator

This script generates merkle roots for HOTDOG token airdrop contracts using the thirdweb SDK. The script automatically uses the correct HOTDOG token address for your chosen chain.

## Prerequisites

1. Install the required dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env`:
```bash
THIRDWEB_SECRET_KEY=your_secret_key_here
```

## Configuration

Before running the script, you need to update the airdrop contract address in `airdrop/generate-merkle-root.ts`:

```typescript
const AIRDROP_CONTRACT_ADDRESS = "0x..."; // Your airdrop contract address
```

**Note:** The HOTDOG token address is automatically loaded from your project's constants based on the chosen chain. No need to configure it manually!

## Usage

### Method 1: Using npm scripts (Recommended)

```bash
# Generate for Base mainnet (default)
npm run script:generate-merkle

# Generate for Base mainnet (explicit)
npm run script:generate-merkle:base

# Generate for Base Sepolia testnet
npm run script:generate-merkle:testnet

# Pass custom chain argument (note the -- before the argument)
npm run script:generate-merkle -- --chain=base
npm run script:generate-merkle -- --chain=baseSepolia
```

### Method 2: Direct execution

```bash
# Default (Base mainnet)
npx tsx airdrop/generate-merkle-root.ts

# With chain argument
npx tsx airdrop/generate-merkle-root.ts --chain=base
npx tsx airdrop/generate-merkle-root.ts --chain=baseSepolia
npx tsx airdrop/generate-merkle-root.ts --chain=testnet

# Show help
npx tsx airdrop/generate-merkle-root.ts --help
```

### Supported Chains

- `base` or `mainnet` - Base mainnet
- `baseSepolia`, `sepolia`, or `testnet` - Base Sepolia testnet

## Data Formats

### 1. CSV File (default)
The script loads data from `airdrop/example-airdrop-data.csv` by default. The CSV file should have two columns: `address` and `amount`.

```csv
address,amount
0x1234567890123456789012345678901234567890,100
0x2345678901234567890123456789012345678901,150
0x3456789012345678901234567890123456789012,200
```

To use a different CSV file, modify the path in the script:
```typescript
const snapshot = await loadSnapshotFromCSV('airdrop/your-custom-file.csv');
```

### 2. Hard-coded data
If you prefer to use hardcoded data instead of a CSV file, you can replace the CSV loading with:

```typescript
const snapshot = [
  { recipient: "0x1234567890123456789012345678901234567890", amount: 100 },
  { recipient: "0x2345678901234567890123456789012345678901", amount: 150 },
  // ... more recipients
];
```

### 3. JSON File Format
Create a JSON file with the following format (see `airdrop/example-airdrop-data.json`):

```json
{
  "snapshot": [
    {
      "recipient": "0x1234567890123456789012345678901234567890",
      "amount": 100
    }
  ]
}
```

To use a JSON file, modify the script to load from JSON:

```typescript
const snapshot = loadSnapshotFromJSON('./airdrop/your-airdrop-data.json');
```

## Output

The script will generate:

1. **Console output**: Shows the merkle root and snapshot URI
2. **JSON file**: Saves all results to a timestamped file in the airdrop folder (e.g., `airdrop/merkle-tree-1640995200000.json`)

The output JSON contains:
- `merkleRoot`: The generated merkle root hash
- `snapshotUri`: The URI where the snapshot is stored
- `snapshot`: The original recipient data
- `metadata`: Additional information about the generation

## Example Output

```
Generating merkle tree for HOTDOG token airdrop...
Total recipients: 5
Chain: Base (ID: 8453)
Contract Address: 0x...
HOTDOG Token Address: 0x61f47EC6D1d0ef9b095574D7b76cF0467d13fB07

✅ Merkle tree generated successfully!
Merkle Root: 0x1234567890abcdef...
Snapshot URI: https://...

📁 Results saved to: airdrop/merkle-tree-1640995200000.json

🎉 Script completed successfully!
```

## Using the Merkle Root

Once you have the merkle root, you can use it to:

1. **Set up your airdrop contract**: Use the merkle root to initialize your airdrop contract
2. **Verify claims**: Users can claim their tokens using the merkle proof system
3. **Audit purposes**: Keep the generated JSON file for verification and audit trails

## Troubleshooting

- **Missing environment variables**: Ensure `THIRDWEB_SECRET_KEY` is set in your `.env` file
- **Invalid chain argument**: Use supported chains: `base`, `baseSepolia`, `testnet`, or `mainnet`
- **HOTDOG token not found**: The script automatically loads HOTDOG token addresses for supported chains
- **Invalid addresses**: Make sure all recipient addresses are valid Ethereum addresses
- **Contract not found**: Verify your airdrop contract address and chain configuration
- **Network issues**: Check your internet connection and thirdweb API status

## Security Notes

- Never commit your `.env` file to version control
- Store the generated merkle tree files securely as they contain sensitive airdrop data
- Verify the merkle root before using it in production contracts 
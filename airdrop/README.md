# Airdrop Tools

This directory contains tools and scripts for managing HOTDOG token airdrops.

## Files

- **`generate-merkle-root.ts`** - Main script for generating merkle roots for airdrop contracts
- **`MERKLE_ROOT_GENERATOR.md`** - Detailed documentation for the merkle root generator
- **`example-airdrop-data.csv`** - Example CSV format for recipient data
- **`example-airdrop-data.json`** - Example JSON format for recipient data

## Quick Start

```bash
# Generate merkle root for Base mainnet
npm run script:generate-merkle

# Generate merkle root for Base Sepolia testnet
npm run script:generate-merkle:testnet

# With custom chain (note the -- before the argument)
npm run script:generate-merkle -- --chain=base
npm run script:generate-merkle -- --chain=baseSepolia
```

## Documentation

See [`MERKLE_ROOT_GENERATOR.md`](./MERKLE_ROOT_GENERATOR.md) for complete documentation.

## Configuration

1. Set `THIRDWEB_SECRET_KEY` in your `.env` file
2. Update the airdrop contract address in `generate-merkle-root.ts`
3. Prepare your recipient data (CSV, JSON, or hardcoded)
4. Run the script to generate your merkle root

The script automatically uses the correct HOTDOG token address for your chosen chain and saves all results to the airdrop folder. 
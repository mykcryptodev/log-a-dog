# LogADog Ecosystem Deployment Guide

This guide explains how to deploy the complete LogADog ecosystem to Base Sepolia (testnet) or Base Mainnet.

## Prerequisites

1. **Foundry**: Make sure you have Foundry installed
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Node.js & pnpm**: For managing dependencies
   ```bash
   # Install pnpm if you haven't already
   npm install -g pnpm
   
   # Install dependencies
   pnpm install
   ```

3. **Wallet with ETH**: You'll need ETH on the target network for gas fees
   - Base Sepolia: Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Base Mainnet: You'll need real ETH

## Quick Start

### 1. Set up environment variables

Run the deployment script once to generate a template `.env` file:

```bash
./deploy.sh base-sepolia
```

This will create a `.env` file. Fill it out with your values:

```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Platform referrer address (required for mainnet)
PLATFORM_REFERRER=0x0000000000000000000000000000000000000000

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Base Sepolia RPC URL (optional, uses public RPC by default)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Base Mainnet RPC URL (optional, uses public RPC by default)
BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

### 2. Deploy to Base Sepolia (Testnet)

```bash
# Deploy without verification
./deploy.sh base-sepolia

# Deploy with contract verification
./deploy.sh base-sepolia verify
```

### 3. Deploy to Base Mainnet

```bash
# Deploy without verification
./deploy.sh base-mainnet

# Deploy with contract verification
./deploy.sh base-mainnet verify
```

## What Gets Deployed

The deployment script deploys and configures the complete ecosystem:

### 1. **HotdogToken** (ERC-20)
- Initial supply: 100,000,000,000 HOTDOG tokens
- Max supply: 100,000,000,000 HOTDOG tokens
- Minting capabilities for rewards

### 2. **HotdogStaking**
- Minimum stake: 100 HOTDOG tokens
- Base APY: 10%
- Slashing rate: 15% for wrong attestations
- Initial rewards pool: 50K HOTDOG (testnet) / 100K HOTDOG (mainnet)

### 3. **AttestationManager**
- 48-hour voting windows
- Minimum attestation stake: 50 HOTDOG tokens
- Economic incentives for honest participation

### 4. **LogADog** (Main Contract)
- Integrated with the new attestation system
- Backward compatible with old attestation methods

## Configuration

The deployment script automatically:

1. **Grants proper roles**:
   - `MINTER_ROLE` to HotdogStaking and AttestationManager
   - `ATTESTATION_MANAGER_ROLE` to AttestationManager

2. **Sets up contract references**:
   - AttestationManager knows about LogADog contract
   - LogADog knows about AttestationManager

3. **Funds the rewards pool**:
   - Mints initial rewards tokens
   - Deposits them into the staking contract

## Network-Specific Settings

### Base Sepolia (Testnet)
- Chain ID: 84532
- Platform referrer: Uses deployer address
- Initial rewards: 50,000 HOTDOG tokens
- Explorer: https://sepolia.basescan.org

### Base Mainnet
- Chain ID: 8453
- Platform referrer: Must be set in `.env` file
- Initial rewards: 100,000 HOTDOG tokens
- Explorer: https://basescan.org

## Manual Deployment (Advanced)

If you prefer to deploy manually using Foundry directly:

```bash
# Deploy to Base Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --legacy

# Deploy to Base Mainnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --legacy
```

## Deployment Output

After successful deployment, you'll get:

1. **Console output** with all contract addresses
2. **JSON file** in `deployments/` directory with deployment details
3. **Latest deployment** copied to `deployments/latest-{network}.json`

Example output:
```
=== DEPLOYMENT COMPLETE ===
Network: Base Sepolia
Chain ID: 84532
Deployer: 0x1234...
Platform Referrer: 0x1234...

=== CONTRACT ADDRESSES ===
HotdogToken: 0xabcd...
HotdogStaking: 0xefgh...
AttestationManager: 0xijkl...
LogADog: 0xmnop...

=== TOKEN INFO ===
Total Supply: 100000000000 HOTDOG
Max Supply: 100000000000 HOTDOG
Rewards Pool: 50000 HOTDOG
```

## Verification

Contract verification happens automatically if you:
1. Pass the `verify` flag to the deployment script
2. Have `ETHERSCAN_API_KEY` set in your `.env` file

You can also verify manually later:
```bash
forge verify-contract \
  --chain-id 84532 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  0xYourContractAddress \
  src/HotdogToken.sol:HotdogToken
```

## Post-Deployment Steps

1. **Test the deployment**:
   - Try staking some tokens
   - Log a hotdog
   - Create an attestation

2. **Update your frontend**:
   - Use the contract addresses from the deployment output
   - Update your ABI files if needed

3. **Monitor the contracts**:
   - Set up monitoring for important events
   - Watch for any unusual activity

## Troubleshooting

### Common Issues

1. **"Insufficient funds for gas"**
   - Make sure your wallet has enough ETH for gas fees
   - Base Sepolia: Get testnet ETH from the faucet
   - Base Mainnet: You need real ETH

2. **"PLATFORM_REFERRER not set"**
   - For mainnet deployment, you must set a valid platform referrer address
   - This cannot be the zero address

3. **"Contract verification failed"**
   - Check that your Etherscan API key is valid
   - Verification can be done manually later if needed

4. **"RPC URL not responding"**
   - Try using a different RPC URL in your `.env` file
   - Check if the network is experiencing issues

### Getting Help

If you encounter issues:
1. Check the Foundry documentation
2. Verify your `.env` file is correctly configured
3. Make sure you have the latest version of Foundry
4. Check Base network status

## Security Considerations

1. **Private Key Security**:
   - Never commit your `.env` file to version control
   - Use a dedicated deployment wallet
   - Consider using hardware wallets for mainnet

2. **Platform Referrer**:
   - Set this to a trusted address for mainnet
   - This address will receive platform fees

3. **Admin Roles**:
   - The deployer gets admin roles by default
   - Consider transferring admin roles to a multisig wallet
   - Review all granted permissions after deployment

## Gas Costs

Approximate gas costs for deployment:

- **Base Sepolia**: ~0.001 ETH total
- **Base Mainnet**: ~0.005-0.01 ETH total (depending on gas prices)

The deployment includes:
- 4 contract deployments
- Multiple role grants
- Initial token minting and staking
- Contract configuration calls 
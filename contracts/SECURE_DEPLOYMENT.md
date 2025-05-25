# Secure Deployment Guide

This guide covers secure methods for deploying the LogADog ecosystem without storing private keys in plain text files.

## 🔐 Security Options

### 1. **Interactive Mode (Recommended)**

The safest option for development and testing. You'll be prompted to enter your private key securely:

```bash
# Deploy with interactive private key entry
./deploy-secure.sh base-sepolia interactive verify
```

When prompted, paste your private key (it won't be displayed on screen).

> **Note**: The secure deployment script uses `--interactives 1` flag (not `--interactive`) for forge script commands.

### 2. **Hardware Wallets**

For maximum security, especially on mainnet:

#### Ledger Hardware Wallet
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --ledger \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

#### Trezor Hardware Wallet
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --trezor \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 3. **Keystore Files**

Create an encrypted keystore file for your private key:

#### Create Keystore
```bash
# Create encrypted keystore
cast wallet import deployer --interactive
```

This will prompt you to:
1. Enter your private key
2. Set a password for the keystore
3. Save it to `~/.foundry/keystores/deployer`

#### Deploy with Keystore
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --account deployer \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 4. **Mnemonic Phrases**

Use a mnemonic phrase instead of raw private keys:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --mnemonic "your twelve word mnemonic phrase here" \
  --mnemonic-index 0 \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 5. **Cloud Key Management (Production)**

For production deployments, use cloud-based key management:

#### AWS KMS
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --aws \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

#### Google Cloud KMS
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --gcp \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🛡️ Security Best Practices

### Environment Setup

Create a secure `.env` file that only contains non-sensitive data:

```env
# Safe to store - no private keys
ETHERSCAN_API_KEY=your_etherscan_api_key_here
PLATFORM_REFERRER=0x1234567890123456789012345678901234567890
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# DO NOT store private keys here in production
# PRIVATE_KEY=  # Leave this commented out for security
```

### Deployment Wallet Security

1. **Use Dedicated Deployment Wallets**
   - Create separate wallets just for deployment
   - Don't use your main wallet with large balances

2. **Minimum Required Balance**
   - Only fund with the minimum ETH needed for deployment
   - Base Sepolia: ~0.001 ETH
   - Base Mainnet: ~0.01 ETH

3. **Hardware Wallet for Mainnet**
   - Always use hardware wallets for mainnet deployments
   - Never enter mainnet private keys on potentially compromised machines

### Access Control After Deployment

After deployment, consider transferring admin roles to a multisig wallet:

```solidity
// Transfer admin role to multisig
hotdogToken.grantRole(DEFAULT_ADMIN_ROLE, multisigAddress);
hotdogToken.revokeRole(DEFAULT_ADMIN_ROLE, deployerAddress);
```

## 📋 Secure Deployment Workflows

### Development/Testing Workflow

```bash
# 1. Use interactive mode for testnet
./deploy-secure.sh base-sepolia interactive verify

# 2. Test deployment
./test-deployment.sh base-sepolia

# 3. Verify contracts
./verify.sh base-sepolia
```

### Production Workflow

```bash
# 1. Set up hardware wallet
# Connect your Ledger/Trezor device

# 2. Deploy with hardware wallet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --ledger \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# 3. Validate deployment
./test-deployment.sh base-mainnet

# 4. Transfer admin roles to multisig (recommended)
```

### CI/CD Workflow

For automated deployments in CI/CD:

```bash
# Use encrypted secrets in your CI/CD platform
# Store keystore file as encrypted secret
# Use keystore method in deployment scripts

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --keystore $KEYSTORE_PATH \
  --password $KEYSTORE_PASSWORD \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🔍 Verification Commands

### Verify Deployment Security

Check that no private keys are stored in files:

```bash
# Check for private keys in files (should return nothing)
grep -r "PRIVATE_KEY=" . --exclude-dir=node_modules --exclude="*.md"

# Check .env file permissions
ls -la .env

# Ensure .env is in .gitignore
grep ".env" .gitignore
```

### Audit Deployment

After deployment, verify the setup:

```bash
# Check contract ownership
cast call $CONTRACT_ADDRESS "hasRole(bytes32,address)" $DEFAULT_ADMIN_ROLE $YOUR_ADDRESS

# Check balances
cast balance $DEPLOYER_ADDRESS

# Verify contract code
forge verify-check --chain-id $CHAIN_ID $VERIFICATION_ID
```

## ⚠️ Security Warnings

### Never Do This:
- ❌ Store private keys in plain text files
- ❌ Commit `.env` files with private keys to git
- ❌ Share private keys in chat/email
- ❌ Use the same wallet for deployment and daily use
- ❌ Deploy to mainnet without hardware wallet

### Always Do This:
- ✅ Use interactive mode for development
- ✅ Use hardware wallets for mainnet
- ✅ Use dedicated deployment wallets
- ✅ Verify contracts after deployment
- ✅ Transfer admin roles to multisig
- ✅ Keep deployment wallets with minimal balances

## 🆘 Emergency Procedures

### If Private Key is Compromised:

1. **Immediately transfer all funds** from the compromised wallet
2. **Revoke all roles** from the compromised address
3. **Grant roles to new secure address**
4. **Update all systems** to use new wallet
5. **Audit all recent transactions** from compromised wallet

### Recovery Commands:

```bash
# Emergency role transfer (run from secure wallet)
cast send $CONTRACT_ADDRESS "grantRole(bytes32,address)" $DEFAULT_ADMIN_ROLE $NEW_SECURE_ADDRESS --private-key $SECURE_PRIVATE_KEY

# Revoke compromised role
cast send $CONTRACT_ADDRESS "revokeRole(bytes32,address)" $DEFAULT_ADMIN_ROLE $COMPROMISED_ADDRESS --private-key $SECURE_PRIVATE_KEY
```

## 📚 Additional Resources

- [Foundry Wallet Management](https://book.getfoundry.sh/reference/cli/cast/wallet/private-key)
- [Hardware Wallet Setup](https://book.getfoundry.sh/tutorials/solidity-scripting#deploying-our-contract)
- [Keystore Management](https://book.getfoundry.sh/reference/cli/cast/wallet)
- [Multisig Best Practices](https://blog.openzeppelin.com/gnosis-safe-multisig-wallet-audit/)

Remember: **Security is not optional**. Take the time to set up secure deployment practices from the beginning. 
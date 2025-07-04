# LogADog Smart Contract Ecosystem

A comprehensive smart contract ecosystem for logging hotdog consumption with economic incentives for honest attestation through staking and voting mechanisms.

## 🏗️ Architecture

The LogADog ecosystem consists of four main contracts:

1. **HotdogToken** - ERC-20 token for staking and rewards
2. **HotdogStaking** - Staking contract with rewards and slashing
3. **AttestationManager** - Manages voting and economic incentives
4. **LogADog** - Main contract for logging hotdogs

## 🚀 Quick Deployment

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js & pnpm
- ETH for gas fees

### Deploy to Base Sepolia (Testnet)

```bash
# Install dependencies
pnpm install

# Secure deployment (recommended)
./deploy-secure.sh base-sepolia interactive verify

# Or traditional deployment
./deploy.sh base-sepolia verify
```

### Deploy to Base Mainnet

```bash
# Secure deployment with hardware wallet (recommended)
./deploy-secure.sh base-mainnet ledger verify

# Or traditional deployment (requires private key in .env)
./deploy.sh base-mainnet verify
```

## 📋 Deployment Scripts

- **`./deploy.sh`** - Main deployment script (requires private key in .env)
- **`./deploy-secure.sh`** - Secure deployment with multiple wallet options
- **`./verify.sh`** - Verify contracts on Etherscan
- **`./test-deployment.sh`** - Validate deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and [SECURE_DEPLOYMENT.md](./SECURE_DEPLOYMENT.md) for secure wallet options.

## 🧪 Testing

Run the complete test suite:

```bash
forge test
```

Run tests with gas reporting:

```bash
forge test --gas-report
```

## 🏛️ Contract Details

### HotdogToken (ERC-20)
- **Supply**: 1M initial, 10M max
- **Decimals**: 18
- **Features**: Minting for rewards, access control

### HotdogStaking
- **Min Stake**: 300,000 HOTDOG
- **Base APY**: 10%
- **Slashing**: 15% for wrong attestations
- **Features**: Token locking, rewards distribution

### AttestationManager
- **Voting Window**: 48 hours
- **Min Attestation Stake**: 30,000 HOTDOG
- **Features**: Economic incentives, slashing, rewards

### LogADog
- **Features**: Hotdog logging, Zora integration, attestation system
- **Backward Compatible**: Works with old attestation methods

## 💰 Economic Model

### Staking Rewards
- **Base Rate**: 10% APY for all stakers
- **Bonus Rewards**: Additional rewards from slashed tokens

### Attestation Economics
- **Stake Requirement**: 30,000 HOTDOG minimum
- **Voting Period**: 48 hours
- **Rewards**: Winners get proportional share of 15% slashed from losers
- **Slashing**: 15% of stake for wrong attestations

### Game Theory
- Economic incentives encourage honest participation
- Majority consensus determines validity
- Losing side's tokens partially redistributed to winners

## 🔧 Development

### Building

```bash
forge build
```

### Testing

```bash
forge test
```

### Local Development

```bash
# Start local node
anvil

# Deploy to local network
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

## 📁 Project Structure

```
contracts/
├── src/
│   ├── HotdogToken.sol          # ERC-20 token
│   ├── HotdogStaking.sol        # Staking with rewards
│   ├── AttestationManager.sol   # Voting and economics
│   └── LogADog.sol             # Main logging contract
├── test/
│   ├── LogADog.t.sol           # Original tests
│   └── EcosystemTest.t.sol     # New ecosystem tests
├── script/
│   └── Deploy.s.sol            # Deployment script
├── deploy.sh                   # Deployment helper
├── verify.sh                   # Verification helper
├── test-deployment.sh          # Deployment validator
└── DEPLOYMENT.md               # Detailed deployment guide
```

## 🌐 Supported Networks

- **Base Sepolia** (Testnet) - Chain ID: 84532
- **Base Mainnet** - Chain ID: 8453

## 🔐 Security Features

- **Access Control**: Role-based permissions
- **Reentrancy Protection**: SafeERC20 and ReentrancyGuard
- **Token Locking**: Prevents double-spending during attestations
- **Economic Security**: Game theory incentives for honest behavior

## 📖 Usage Examples

### Stake Tokens
```solidity
// Approve tokens first
hotdogToken.approve(address(stakingContract), amount);
// Stake tokens
stakingContract.stake(amount);
```

### Log a Hotdog
```solidity
// Log hotdog (creates Zora coin and starts attestation)
logADog.logHotdog{value: 1 ether}(
    "imageUri",
    "metadataUri", 
    msg.sender,
    bytes("0x0")
);
```

### Attest to Hotdog
```solidity
// Attest through AttestationManager
attestationManager.attestToHotdog(logId, true, stakeAmount);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

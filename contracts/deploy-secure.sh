#!/bin/bash

# LogADog Secure Deployment Script
# Usage: ./deploy-secure.sh [network] [wallet-type] [verify]
# Wallet types: interactive, ledger, trezor, keystore, mnemonic
# Example: ./deploy-secure.sh base-sepolia interactive verify

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: ./deploy-secure.sh [network] [wallet-type] [verify]"
    echo ""
    echo "Networks:"
    echo "  base-sepolia    Deploy to Base Sepolia testnet"
    echo "  base-mainnet    Deploy to Base Mainnet"
    echo ""
    echo "Wallet Types:"
    echo "  interactive     Enter private key interactively (safest for development)"
    echo "  ledger          Use Ledger hardware wallet (recommended for mainnet)"
    echo "  trezor          Use Trezor hardware wallet (recommended for mainnet)"
    echo "  keystore        Use encrypted keystore file"
    echo "  mnemonic        Use mnemonic phrase"
    echo ""
    echo "Options:"
    echo "  verify                 Verify contracts on Etherscan after deployment"
    echo ""
    echo "Examples:"
    echo "  ./deploy-secure.sh base-sepolia interactive"
    echo "  ./deploy-secure.sh base-sepolia interactive verify"
    echo "  ./deploy-secure.sh base-mainnet ledger verify"
}

# Check if network and wallet type are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    print_error "Please specify network and wallet type"
    show_usage
    exit 1
fi

NETWORK=$1
WALLET_TYPE=$2
VERIFY=""
HOTDOG_TOKEN=""

# Parse optional parameters
if [ -n "$3" ]; then
    if [ "$3" = "verify" ]; then
        VERIFY="verify"
    elif [ "$3" = "noverify" ]; then
        # Explicitly no verification
        VERIFY=""
    fi
fi

# Set network-specific variables
case $NETWORK in
    "base-sepolia")
        RPC_URL="https://sepolia.base.org"
        CHAIN_ID=84532
        EXPLORER_URL="https://sepolia.basescan.org"
        ;;
    "base-mainnet")
        RPC_URL="https://mainnet.base.org"
        CHAIN_ID=8453
        EXPLORER_URL="https://basescan.org"
        ;;
    *)
        print_error "Unsupported network: $NETWORK"
        echo "Supported networks: base-sepolia, base-mainnet"
        exit 1
        ;;
esac

print_status "🔐 Secure deployment to $NETWORK using $WALLET_TYPE wallet"
print_status "Chain ID: $CHAIN_ID"
print_status "RPC URL: $RPC_URL"

# Prompt for existing HotDog token
echo ""
print_status "HotDog Token Configuration"
echo "Do you want to use an existing HotDog token? (y/n)"
read -p "Enter your choice: " use_existing_token

if [[ "$use_existing_token" =~ ^[Yy]$ ]]; then
    while true; do
        echo ""
        read -p "Enter the existing HotDog token address (0x...): " HOTDOG_TOKEN
        
        # Validate token address format
        if [[ "$HOTDOG_TOKEN" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
            print_status "Using existing HotDog token: $HOTDOG_TOKEN"
            break
        else
            print_error "Invalid token address format: $HOTDOG_TOKEN"
            print_status "Token address must be a valid Ethereum address (0x followed by 40 hex characters)"
            echo "Please try again."
        fi
    done
else
    print_status "Will deploy new HotDog token"
fi

# Check if .env file exists (for non-sensitive config)
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating secure template..."
    cat > .env << EOF
# Secure .env template - NO PRIVATE KEYS STORED HERE
# Only non-sensitive configuration

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Platform referrer address (hardcoded in deployment script)
# Platform referrer: 0x3dE0ba94A1F291A7c44bb029b765ADB2C487063F

# RPC URLs (optional, uses public RPCs by default)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# DO NOT ADD PRIVATE KEYS TO THIS FILE
# Use secure wallet options instead
EOF
    print_error "Please fill in your .env file with non-sensitive values and run the script again."
    exit 1
fi

# Source environment variables
source .env

# Create deployments directory if it doesn't exist
mkdir -p deployments

print_status "Starting secure deployment..."

# Build wallet-specific command
WALLET_FLAGS=""
case $WALLET_TYPE in
    "interactive")
        WALLET_FLAGS="--interactives 1"
        print_status "You will be prompted to enter your private key securely"
        ;;
    "ledger")
        WALLET_FLAGS="--ledger"
        print_status "Please connect and unlock your Ledger device"
        print_warning "Make sure the Ethereum app is open on your Ledger"
        ;;
    "trezor")
        WALLET_FLAGS="--trezor"
        print_status "Please connect and unlock your Trezor device"
        ;;
    "keystore")
        if [ -z "$KEYSTORE_ACCOUNT" ]; then
            print_error "Please set KEYSTORE_ACCOUNT environment variable"
            print_status "Example: export KEYSTORE_ACCOUNT=deployer"
            print_status "Or create keystore: cast wallet import deployer --interactive"
            exit 1
        fi
        WALLET_FLAGS="--account $KEYSTORE_ACCOUNT"
        print_status "Using keystore account: $KEYSTORE_ACCOUNT"
        ;;
    "mnemonic")
        if [ -z "$MNEMONIC_PHRASE" ]; then
            print_error "Please set MNEMONIC_PHRASE environment variable"
            print_status "Example: export MNEMONIC_PHRASE=\"your twelve word mnemonic phrase here\""
            exit 1
        fi
        MNEMONIC_INDEX=${MNEMONIC_INDEX:-0}
        WALLET_FLAGS="--mnemonic \"$MNEMONIC_PHRASE\" --mnemonic-index $MNEMONIC_INDEX"
        print_status "Using mnemonic phrase with index: $MNEMONIC_INDEX"
        ;;
    *)
        print_error "Unsupported wallet type: $WALLET_TYPE"
        show_usage
        exit 1
        ;;
esac

# Set existing hotdog token if provided
if [ -n "$HOTDOG_TOKEN" ]; then
    export EXISTING_HOTDOG_TOKEN=$HOTDOG_TOKEN
fi

# Build deployment command
DEPLOY_CMD="forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --legacy $WALLET_FLAGS"

# Add verification if requested
if [ "$VERIFY" = "verify" ]; then
    if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" = "your_etherscan_api_key_here" ]; then
        print_warning "ETHERSCAN_API_KEY not set. Skipping verification."
    else
        print_status "Contract verification enabled"
        DEPLOY_CMD="$DEPLOY_CMD --verify --etherscan-api-key $ETHERSCAN_API_KEY"
    fi
fi

print_status "Executing deployment command..."
print_status "Command: $DEPLOY_CMD"

# Security warning for mainnet
if [ "$NETWORK" = "base-mainnet" ]; then
    print_warning "⚠️  MAINNET DEPLOYMENT WARNING ⚠️"
    echo "You are about to deploy to MAINNET. This will:"
    echo "- Use real ETH for gas fees"
    echo "- Deploy contracts that cannot be easily changed"
    echo "- Create tokens with real economic value"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_status "Deployment cancelled by user"
        exit 0
    fi
fi

# Execute deployment
if eval $DEPLOY_CMD; then
    print_success "🎉 Secure deployment completed successfully!"
    
    # Find the latest deployment file
    LATEST_DEPLOYMENT=$(ls -t deployments/${CHAIN_ID}-*.json 2>/dev/null | head -n1)
    
    if [ -n "$LATEST_DEPLOYMENT" ]; then
        print_status "Deployment details saved to: $LATEST_DEPLOYMENT"
        
        # Extract contract addresses from deployment file
        print_status "Contract addresses:"
        echo "===================="
        
        if command -v jq &> /dev/null; then
            jq -r '.contracts | to_entries[] | "\(.key): \(.value)"' "$LATEST_DEPLOYMENT"
        else
            grep -o '"[^"]*": "0x[^"]*"' "$LATEST_DEPLOYMENT" | sed 's/"//g'
        fi
        
        echo "===================="
        print_status "Explorer: $EXPLORER_URL"
        
        # Create a simple deployment summary
        SUMMARY_FILE="deployments/latest-${NETWORK}.json"
        cp "$LATEST_DEPLOYMENT" "$SUMMARY_FILE"
        print_status "Latest deployment info copied to: $SUMMARY_FILE"
        
        # Security recommendations
        print_status "🔐 Security Recommendations:"
        echo "1. Verify contracts on $EXPLORER_URL"
        echo "2. Test the deployment with small amounts first"
        echo "3. Consider transferring admin roles to a multisig wallet"
        echo "4. Monitor contract events and transactions"
        echo "5. Keep deployment details secure and backed up"
        
        if [ -n "$HOTDOG_TOKEN" ]; then
            print_warning "Using existing HotDog token - additional notes:"
            echo "- Ensure the deployer has MINTER_ROLE on the token for full functionality"
            echo "- If not, manually grant MINTER_ROLE to HotdogStaking and AttestationManager"
            echo "- Verify the token has sufficient supply/balance for rewards pool"
        fi
        
        if [ "$NETWORK" = "base-mainnet" ]; then
            print_warning "MAINNET DEPLOYMENT - Additional Security Steps:"
            echo "- Transfer admin roles to a multisig wallet ASAP"
            echo "- Set up monitoring and alerting"
            echo "- Conduct a security audit if handling significant value"
            echo "- Document emergency procedures"
        fi
        
    else
        print_warning "Could not find deployment file"
    fi
    
else
    print_error "Deployment failed!"
    exit 1
fi

print_success "🎉 LogADog ecosystem deployed securely to $NETWORK!"
print_status "Next steps:"
echo "1. Run validation: ./test-deployment.sh $NETWORK"
echo "2. Verify contracts: ./verify.sh $NETWORK"
echo "3. Update your frontend with the new contract addresses"
echo "4. Set up monitoring and alerting" 
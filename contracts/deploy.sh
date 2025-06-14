#!/bin/bash

# LogADog Ecosystem Deployment Script
# Usage: ./deploy.sh [network] [verify]
# Networks: base-sepolia, base-mainnet
# Example: ./deploy.sh base-sepolia verify

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if network is provided
if [ -z "$1" ]; then
    print_error "Please specify a network: base-sepolia or base-mainnet"
    echo "Usage: ./deploy.sh [network] [verify] [interactive]"
    echo "Example: ./deploy.sh base-sepolia verify"
    echo "Example (interactive): ./deploy.sh base-sepolia verify interactive"
    exit 1
fi

NETWORK=$1
VERIFY=$2
INTERACTIVE=$3

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

print_status "Deploying LogADog ecosystem to $NETWORK"
print_status "Chain ID: $CHAIN_ID"
print_status "RPC URL: $RPC_URL"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating template..."
    cat > .env << EOF
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
EOF
    print_error "Please fill in your .env file with the required values and run the script again."
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables (skip if using interactive mode)
if [ "$INTERACTIVE" != "true" ]; then
    if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
        print_error "Please set PRIVATE_KEY in your .env file or use interactive mode"
        print_status "To use interactive mode: ./deploy.sh $NETWORK $VERIFY interactive"
        exit 1
    fi
fi

if [ "$NETWORK" = "base-mainnet" ]; then
    if [ -z "$PLATFORM_REFERRER" ] || [ "$PLATFORM_REFERRER" = "0x0000000000000000000000000000000000000000" ]; then
        print_error "Please set PLATFORM_REFERRER in your .env file for mainnet deployment"
        exit 1
    fi
fi

# Create deployments directory if it doesn't exist
mkdir -p deployments

print_status "Starting deployment..."

# Deploy contracts
if [ "$INTERACTIVE" = "true" ]; then
    DEPLOY_CMD="forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --legacy --interactive"
else
    DEPLOY_CMD="forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --legacy"
fi

if [ "$VERIFY" = "verify" ]; then
    if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" = "your_etherscan_api_key_here" ]; then
        print_warning "ETHERSCAN_API_KEY not set. Skipping verification."
    else
        print_status "Contract verification enabled"
        DEPLOY_CMD="$DEPLOY_CMD --verify --etherscan-api-key $ETHERSCAN_API_KEY"
    fi
fi

print_status "Executing deployment command..."
echo "Command: $DEPLOY_CMD"

# Execute deployment
if eval $DEPLOY_CMD; then
    print_success "Deployment completed successfully!"
    
    # Find the latest deployment file
    LATEST_DEPLOYMENT=$(ls -t deployments/${CHAIN_ID}-*.json 2>/dev/null | head -n1)
    
    if [ -n "$LATEST_DEPLOYMENT" ]; then
        print_status "Deployment details saved to: $LATEST_DEPLOYMENT"
        
        # Extract contract addresses from deployment file
        print_status "Contract addresses:"
        echo "===================="
        
        if command -v jq &> /dev/null; then
            # Use jq if available for pretty printing
            jq -r '.contracts | to_entries[] | "\(.key): \(.value)"' "$LATEST_DEPLOYMENT"
        else
            # Fallback to grep if jq is not available
            grep -o '"[^"]*": "0x[^"]*"' "$LATEST_DEPLOYMENT" | sed 's/"//g'
        fi
        
        echo "===================="
        print_status "Explorer: $EXPLORER_URL"
        
        # Create a simple deployment summary
        SUMMARY_FILE="deployments/latest-${NETWORK}.json"
        cp "$LATEST_DEPLOYMENT" "$SUMMARY_FILE"
        print_status "Latest deployment info copied to: $SUMMARY_FILE"
        
    else
        print_warning "Could not find deployment file"
    fi
    
else
    print_error "Deployment failed!"
    exit 1
fi

print_success "🎉 LogADog ecosystem deployed successfully to $NETWORK!"
print_status "Next steps:"
echo "1. Verify contracts on $EXPLORER_URL if not done automatically"
echo "2. Update your frontend with the new contract addresses"
echo "3. Test the deployment with some transactions"
echo "4. Consider setting up monitoring for the contracts" 
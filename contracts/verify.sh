#!/bin/bash

# LogADog Contract Verification Script
# Usage: ./verify.sh [network] [deployment-file]
# Example: ./verify.sh base-sepolia deployments/84532-1234567890.json

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

# Check if network is provided
if [ -z "$1" ]; then
    print_error "Please specify a network: base-sepolia or base-mainnet"
    echo "Usage: ./verify.sh [network] [deployment-file]"
    echo "Example: ./verify.sh base-sepolia deployments/84532-1234567890.json"
    exit 1
fi

NETWORK=$1
DEPLOYMENT_FILE=$2

# Set network-specific variables
case $NETWORK in
    "base-sepolia")
        CHAIN_ID=84532
        ;;
    "base-mainnet")
        CHAIN_ID=8453
        ;;
    *)
        print_error "Unsupported network: $NETWORK"
        echo "Supported networks: base-sepolia, base-mainnet"
        exit 1
        ;;
esac

# If no deployment file specified, try to find the latest one
if [ -z "$DEPLOYMENT_FILE" ]; then
    DEPLOYMENT_FILE="deployments/latest-${NETWORK}.json"
    if [ ! -f "$DEPLOYMENT_FILE" ]; then
        # Try to find the latest deployment file for this chain
        DEPLOYMENT_FILE=$(ls -t deployments/${CHAIN_ID}-*.json 2>/dev/null | head -n1)
        if [ -z "$DEPLOYMENT_FILE" ]; then
            print_error "No deployment file found for $NETWORK"
            echo "Please specify a deployment file or deploy first"
            exit 1
        fi
    fi
fi

# Check if deployment file exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    print_error "Deployment file not found: $DEPLOYMENT_FILE"
    exit 1
fi

print_status "Using deployment file: $DEPLOYMENT_FILE"

# Source environment variables
if [ ! -f .env ]; then
    print_error ".env file not found. Please create it with ETHERSCAN_API_KEY"
    exit 1
fi

source .env

if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" = "your_etherscan_api_key_here" ]; then
    print_error "Please set ETHERSCAN_API_KEY in your .env file"
    exit 1
fi

# Extract contract addresses from deployment file
if command -v jq &> /dev/null; then
    HOTDOG_TOKEN=$(jq -r '.contracts.HotdogToken' "$DEPLOYMENT_FILE")
    HOTDOG_STAKING=$(jq -r '.contracts.HotdogStaking' "$DEPLOYMENT_FILE")
    ATTESTATION_MANAGER=$(jq -r '.contracts.AttestationManager' "$DEPLOYMENT_FILE")
    LOG_A_DOG=$(jq -r '.contracts.LogADog' "$DEPLOYMENT_FILE")
else
    print_error "jq is required for parsing deployment file. Please install jq."
    exit 1
fi

print_status "Verifying contracts on $NETWORK (Chain ID: $CHAIN_ID)"
print_status "HotdogToken: $HOTDOG_TOKEN"
print_status "HotdogStaking: $HOTDOG_STAKING"
print_status "AttestationManager: $ATTESTATION_MANAGER"
print_status "LogADog: $LOG_A_DOG"

# Function to verify a contract
verify_contract() {
    local name=$1
    local address=$2
    local contract_path=$3
    
    print_status "Verifying $name..."
    
    if forge verify-contract \
        --chain-id $CHAIN_ID \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        $address \
        $contract_path; then
        print_success "$name verified successfully"
    else
        print_error "Failed to verify $name"
        return 1
    fi
}

# Verify all contracts
print_status "Starting contract verification..."

verify_contract "HotdogToken" "$HOTDOG_TOKEN" "src/HotdogToken.sol:HotdogToken"
verify_contract "HotdogStaking" "$HOTDOG_STAKING" "src/HotdogStaking.sol:HotdogStaking"
verify_contract "AttestationManager" "$ATTESTATION_MANAGER" "src/AttestationManager.sol:AttestationManager"
verify_contract "LogADog" "$LOG_A_DOG" "src/LogADog.sol:LogADog"

print_success "🎉 All contracts verified successfully!"
print_status "You can view them on the block explorer:"

case $NETWORK in
    "base-sepolia")
        EXPLORER_URL="https://sepolia.basescan.org"
        ;;
    "base-mainnet")
        EXPLORER_URL="https://basescan.org"
        ;;
esac

echo "HotdogToken: $EXPLORER_URL/address/$HOTDOG_TOKEN"
echo "HotdogStaking: $EXPLORER_URL/address/$HOTDOG_STAKING"
echo "AttestationManager: $EXPLORER_URL/address/$ATTESTATION_MANAGER"
echo "LogADog: $EXPLORER_URL/address/$LOG_A_DOG" 
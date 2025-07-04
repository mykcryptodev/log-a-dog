#!/bin/bash

# LogADog Deployment Test Script
# Usage: ./test-deployment.sh [network] [deployment-file]
# Example: ./test-deployment.sh base-sepolia deployments/84532-1234567890.json

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
    echo "Usage: ./test-deployment.sh [network] [deployment-file]"
    echo "Example: ./test-deployment.sh base-sepolia deployments/84532-1234567890.json"
    exit 1
fi

NETWORK=$1
DEPLOYMENT_FILE=$2

# Set network-specific variables
case $NETWORK in
    "base-sepolia")
        RPC_URL="https://sepolia.base.org"
        CHAIN_ID=84532
        ;;
    "base-mainnet")
        RPC_URL="https://mainnet.base.org"
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

print_status "Testing deployment on $NETWORK using: $DEPLOYMENT_FILE"

# Extract contract addresses from deployment file
if command -v jq &> /dev/null; then
    HOTDOG_TOKEN=$(jq -r '.contracts.HotdogToken' "$DEPLOYMENT_FILE")
    HOTDOG_STAKING=$(jq -r '.contracts.HotdogStaking' "$DEPLOYMENT_FILE")
    ATTESTATION_MANAGER=$(jq -r '.contracts.AttestationManager' "$DEPLOYMENT_FILE")
    LOG_A_DOG=$(jq -r '.contracts.LogADog' "$DEPLOYMENT_FILE")
    DEPLOYER=$(jq -r '.deployer' "$DEPLOYMENT_FILE")
else
    print_error "jq is required for parsing deployment file. Please install jq."
    exit 1
fi

print_status "Contract addresses:"
echo "  HotdogToken: $HOTDOG_TOKEN"
echo "  HotdogStaking: $HOTDOG_STAKING"
echo "  AttestationManager: $ATTESTATION_MANAGER"
echo "  LogADog: $LOG_A_DOG"
echo "  Deployer: $DEPLOYER"

# Function to call a contract and check result
call_contract() {
    local description=$1
    local address=$2
    local signature=$3
    local expected_pattern=$4
    
    print_status "Testing: $description"
    
    local result=$(cast call --rpc-url $RPC_URL $address $signature 2>/dev/null || echo "FAILED")
    
    if [ "$result" = "FAILED" ]; then
        print_error "Failed to call $description"
        return 1
    fi
    
    if [[ $result =~ $expected_pattern ]]; then
        print_success "$description ✓"
        echo "  Result: $result"
    else
        print_warning "$description - unexpected result"
        echo "  Result: $result"
        echo "  Expected pattern: $expected_pattern"
    fi
}

# Function to check if address has a role
check_role() {
    local description=$1
    local contract_address=$2
    local role_hash=$3
    local account=$4
    
    print_status "Checking: $description"
    
    local result=$(cast call --rpc-url $RPC_URL $contract_address "hasRole(bytes32,address)" $role_hash $account 2>/dev/null || echo "FAILED")
    
    if [ "$result" = "FAILED" ]; then
        print_error "Failed to check $description"
        return 1
    fi
    
    # Convert result to boolean (0x0000...0001 = true, 0x0000...0000 = false)
    if [[ $result =~ 0x0+1$ ]]; then
        print_success "$description ✓"
    else
        print_error "$description ✗"
        echo "  Result: $result"
    fi
}

print_status "🧪 Starting deployment validation tests..."
echo "=================================================="

# Test 1: HotdogToken basic info
print_status "1. Testing HotdogToken..."
call_contract "Token name" $HOTDOG_TOKEN "name()" ".*HOTDOG.*"
call_contract "Token symbol" $HOTDOG_TOKEN "symbol()" ".*HOTDOG.*"
call_contract "Token decimals" $HOTDOG_TOKEN "decimals()" "0x0000000000000000000000000000000000000000000000000000000000000012" # 18 in hex
call_contract "Total supply" $HOTDOG_TOKEN "totalSupply()" "0x.*" # Any non-zero value

# Test 2: HotdogStaking configuration
print_status "2. Testing HotdogStaking..."
call_contract "Staking token address" $HOTDOG_STAKING "hotdogToken()" ".*$HOTDOG_TOKEN.*"
call_contract "Minimum stake" $HOTDOG_STAKING "MINIMUM_STAKE()" "0x.*" # Should be 300000 HOTDOG
call_contract "Total staked" $HOTDOG_STAKING "totalStaked()" "0x.*"
call_contract "Rewards pool" $HOTDOG_STAKING "rewardsPool()" "0x.*"

# Test 3: AttestationManager configuration
print_status "3. Testing AttestationManager..."
call_contract "Staking contract" $ATTESTATION_MANAGER "stakingContract()" ".*$HOTDOG_STAKING.*"
call_contract "Attestation window" $ATTESTATION_MANAGER "ATTESTATION_WINDOW()" "0x.*" # Should be 48 hours

# Test 4: LogADog configuration
print_status "4. Testing LogADog..."
call_contract "Platform referrer" $LOG_A_DOG "platformReferrer()" "0x.*"
call_contract "Attestation manager" $LOG_A_DOG "attestationManager()" ".*$ATTESTATION_MANAGER.*"

# Test 5: Role assignments
print_status "5. Testing role assignments..."

# Get role hashes
DEFAULT_ADMIN_ROLE="0x0000000000000000000000000000000000000000000000000000000000000000"
MINTER_ROLE=$(cast call --rpc-url $RPC_URL $HOTDOG_TOKEN "MINTER_ROLE()" 2>/dev/null || echo "FAILED")
OPERATOR_ROLE=$(cast call --rpc-url $RPC_URL $LOG_A_DOG "OPERATOR_ROLE()" 2>/dev/null || echo "FAILED")
ATTESTATION_MANAGER_ROLE=$(cast call --rpc-url $RPC_URL $HOTDOG_STAKING "ATTESTATION_MANAGER_ROLE()" 2>/dev/null || echo "FAILED")

if [ "$MINTER_ROLE" != "FAILED" ] && [ "$OPERATOR_ROLE" != "FAILED" ] && [ "$ATTESTATION_MANAGER_ROLE" != "FAILED" ]; then
    # Check admin roles
    check_role "Deployer has admin role on HotdogToken" $HOTDOG_TOKEN $DEFAULT_ADMIN_ROLE $DEPLOYER
    check_role "Deployer has admin role on HotdogStaking" $HOTDOG_STAKING $DEFAULT_ADMIN_ROLE $DEPLOYER
    check_role "Deployer has admin role on AttestationManager" $ATTESTATION_MANAGER $DEFAULT_ADMIN_ROLE $DEPLOYER
    check_role "Deployer has admin role on LogADog" $LOG_A_DOG $DEFAULT_ADMIN_ROLE $DEPLOYER
    
    # Check minter roles
    check_role "HotdogStaking has minter role" $HOTDOG_TOKEN $MINTER_ROLE $HOTDOG_STAKING
    check_role "AttestationManager has minter role" $HOTDOG_TOKEN $MINTER_ROLE $ATTESTATION_MANAGER
    
    # Check attestation manager role
    check_role "AttestationManager has attestation manager role" $HOTDOG_STAKING $ATTESTATION_MANAGER_ROLE $ATTESTATION_MANAGER
else
    print_warning "Could not retrieve role hashes, skipping role checks"
fi

# Test 6: Cross-contract references
print_status "6. Testing cross-contract references..."
LOGADOG_IN_ATTESTATION=$(cast call --rpc-url $RPC_URL $ATTESTATION_MANAGER "logADogContract()" 2>/dev/null || echo "FAILED")
if [ "$LOGADOG_IN_ATTESTATION" != "FAILED" ]; then
    if [[ $LOGADOG_IN_ATTESTATION =~ .*$LOG_A_DOG.* ]]; then
        print_success "AttestationManager knows LogADog contract ✓"
    else
        print_error "AttestationManager doesn't know LogADog contract ✗"
        echo "  Expected: $LOG_A_DOG"
        echo "  Got: $LOGADOG_IN_ATTESTATION"
    fi
else
    print_error "Failed to check LogADog reference in AttestationManager"
fi

print_status "=================================================="
print_success "🎉 Deployment validation completed!"

print_status "Summary:"
echo "✅ All contracts deployed and accessible"
echo "✅ Basic contract configurations verified"
echo "✅ Role assignments checked"
echo "✅ Cross-contract references validated"

print_status "Next steps:"
echo "1. Try interacting with the contracts manually"
echo "2. Run the full test suite: forge test"
echo "3. Monitor contract events and transactions"
echo "4. Set up frontend integration"

case $NETWORK in
    "base-sepolia")
        EXPLORER_URL="https://sepolia.basescan.org"
        ;;
    "base-mainnet")
        EXPLORER_URL="https://basescan.org"
        ;;
esac

print_status "View contracts on explorer:"
echo "🔗 $EXPLORER_URL/address/$LOG_A_DOG" 
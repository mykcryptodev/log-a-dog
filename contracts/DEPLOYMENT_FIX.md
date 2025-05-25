# Deployment Fix: Interactive Flag Correction

## Issue
The secure deployment script was using `--interactive` flag which doesn't exist in Foundry's `forge script` command, causing the error:
```
tip: a similar argument exists: '--interactives'
```

## Root Cause
Foundry's `forge script` command uses `--interactives <NUM>` (with 's' and a number parameter) instead of `--interactive`.

## Solution
Updated the secure deployment script to use the correct flag:

### Before
```bash
WALLET_FLAGS="--interactive"
```

### After
```bash
WALLET_FLAGS="--interactives 1"
```

## Files Updated
1. **contracts/deploy-secure.sh** - Fixed the interactive wallet flag
2. **contracts/SECURE_DEPLOYMENT.md** - Updated documentation with correct usage and added note about the flag

## Verification
The deployment command now correctly generates:
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url https://sepolia.base.org --broadcast --legacy --interactives 1
```

## Usage
The secure deployment script now works correctly with interactive mode:
```bash
./deploy-secure.sh base-sepolia interactive verify
```

This will prompt the user to enter their private key securely without storing it in any files.

## Documentation Reference
According to Foundry documentation:
- `--interactives <NUM>`: Open an interactive prompt to enter your private key. Takes a value for the number of keys to enter. Default: 0

The flag requires a numeric parameter specifying how many private keys to enter interactively. 
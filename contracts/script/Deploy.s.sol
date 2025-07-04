// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/HotdogToken.sol";
import "../src/HotdogStaking.sol";
import "../src/AttestationManager.sol";
import "../src/CoinDeploymentManager.sol";
import "../src/LogADog.sol";

contract DeployScript is Script {
    // Network configurations
    struct NetworkConfig {
        string name;
        address platformReferrer;
        uint256 initialTokenSupply;
        uint256 initialRewardsPool;
    }
    
    // Contract addresses (will be populated during deployment)
    HotdogToken public hotdogToken;
    HotdogStaking public hotdogStaking;
    AttestationManager public attestationManager;
    CoinDeploymentManager public coinDeploymentManager;
    LogADog public logADog;
    
    // Deployment configuration
    address public deployer;
    NetworkConfig public config;
    address public existingHotdogToken; // Optional existing token address
    
    function run() external {
        // Get deployer address - when using --interactives flag, 
        // the private key is handled by forge automatically
        deployer = msg.sender;
        
        console2.log("Deploying with account:", deployer);
        console2.log("Account balance:", deployer.balance);
        
        // Check for existing Hotdog token address
        try vm.envAddress("EXISTING_HOTDOG_TOKEN") returns (address tokenAddr) {
            if (tokenAddr != address(0)) {
                existingHotdogToken = tokenAddr;
                console2.log("Using existing HotdogToken at:", existingHotdogToken);
            }
        } catch {
            // No existing token provided, will deploy new one
            console2.log("No existing HotdogToken provided, will deploy new one");
        }
        
        // Configure network-specific settings
        _configureNetwork();
        
        vm.startBroadcast();
        
        // Deploy contracts in correct order
        _deployHotdogToken();
        _deployHotdogStaking();
        _deployAttestationManager();
        _deployCoinDeploymentManager();
        _deployLogADog();
        
        // Configure contracts
        _configureContracts();
        
        // Fund initial rewards pool
        _fundRewardsPool();
        
        vm.stopBroadcast();
        
        // Log deployment addresses
        _logDeploymentInfo();
        
        // Save deployment info to file
        _saveDeploymentInfo();
    }
    
    function _configureNetwork() internal {
        uint256 chainId = block.chainid;
        
        if (chainId == 84532) {
            // Base Sepolia
            config = NetworkConfig({
                name: "Base Sepolia",
                platformReferrer: 0x3dE0ba94A1F291A7c44bb029b765ADB2C487063F, // Platform referrer for coin rewards
                initialTokenSupply: 100000000000 * 10**18, // 100B tokens
                initialRewardsPool: 50000 * 10**18 // 50K tokens for rewards
            });
        } else if (chainId == 8453) {
            // Base Mainnet
            config = NetworkConfig({
                name: "Base Mainnet",
                platformReferrer: 0x3dE0ba94A1F291A7c44bb029b765ADB2C487063F, // Platform referrer for coin rewards
                initialTokenSupply: 100000000000 * 10**18, // 100B tokens
                initialRewardsPool: 100000 * 10**18 // 100K tokens for rewards
            });
        } else {
            revert("Unsupported network");
        }
        
        console2.log("Deploying to:", config.name);
        console2.log("Platform referrer:", config.platformReferrer);
    }
    
    function _deployHotdogToken() internal {
        if (existingHotdogToken != address(0)) {
            // Use existing token
            hotdogToken = HotdogToken(existingHotdogToken);
            console2.log("Using existing HotdogToken at:", address(hotdogToken));
            
            // Basic validation - check if it's an ERC20 token
            try hotdogToken.totalSupply() returns (uint256 supply) {
                console2.log("Verified existing token is ERC20 compatible, total supply:", supply);
            } catch {
                revert("Invalid token address - contract does not implement ERC20 interface");
            }
        } else {
            // Deploy new token
            console2.log("Deploying HotdogToken...");
            hotdogToken = new HotdogToken();
            console2.log("HotdogToken deployed at:", address(hotdogToken));
        }
    }
    
    function _deployHotdogStaking() internal {
        console2.log("Deploying HotdogStaking...");
        hotdogStaking = new HotdogStaking(address(hotdogToken));
        console2.log("HotdogStaking deployed at:", address(hotdogStaking));
    }
    
    function _deployAttestationManager() internal {
        console2.log("Deploying AttestationManager...");
        attestationManager = new AttestationManager(
            address(hotdogStaking)
        );
        console2.log("AttestationManager deployed at:", address(attestationManager));
    }
    
    function _deployCoinDeploymentManager() internal {
        console2.log("Deploying CoinDeploymentManager...");
        coinDeploymentManager = new CoinDeploymentManager(
            0x777777751622c0d3258f214F9DF38E35BF45baF3, // Zora Factory on Base
            "LOGADOG" // Coin symbol
        );
        console2.log("CoinDeploymentManager deployed at:", address(coinDeploymentManager));
    }

    function _deployLogADog() internal {
        console2.log("Deploying LogADog...");
        logADog = new LogADog(
            config.platformReferrer,
            address(attestationManager),
            address(coinDeploymentManager)
        );
        console2.log("LogADog deployed at:", address(logADog));
    }
    
    function _configureContracts() internal {
        console2.log("Configuring contracts...");
        
        // Check if we need to configure roles on HotdogToken
        if (existingHotdogToken != address(0)) {
            // Using existing token - try to configure roles if it supports AccessControl
            try hotdogToken.DEFAULT_ADMIN_ROLE() returns (bytes32 adminRole) {
                console2.log("Existing token supports AccessControl, checking permissions...");
                if (!hotdogToken.hasRole(adminRole, deployer)) {
                    console2.log("WARNING: Deployer does not have admin role on existing HotdogToken");
                    console2.log("Please manually grant MINTER_ROLE to:");
                    console2.log("- HotdogStaking:", address(hotdogStaking));
                    console2.log("- AttestationManager: NOT NEEDED (only redistributes existing tokens)");
                } else {
                    // Grant minter role to staking contract for rewards
                    hotdogToken.grantRole(hotdogToken.MINTER_ROLE(), address(hotdogStaking));
                    console2.log("Granted MINTER_ROLE to HotdogStaking");
                    
                    // AttestationManager doesn't need minting - it only redistributes existing tokens
                    console2.log("AttestationManager doesn't need MINTER_ROLE (only redistributes existing tokens)");
                }
            } catch {
                console2.log("Existing token does not support AccessControl roles");
                console2.log("WARNING: Cannot automatically configure minting permissions");
                console2.log("The ecosystem will work, but some features may be limited:");
                console2.log("- Staking rewards will not be mintable (but can use pre-funded pool)");
                console2.log("- Attestation rewards use existing tokens (no minting needed)");
                console2.log("- Consider using a token with sufficient pre-minted supply");
            }
        } else {
            // New token deployment - grant roles as usual
            // Grant minter role to staking contract for rewards
            hotdogToken.grantRole(hotdogToken.MINTER_ROLE(), address(hotdogStaking));
            console2.log("Granted MINTER_ROLE to HotdogStaking");
            
            // AttestationManager doesn't need minting - it only redistributes existing tokens
            console2.log("AttestationManager doesn't need MINTER_ROLE (only redistributes existing tokens)");
        }
        
        // Grant attestation manager role to attestation manager in staking contract
        hotdogStaking.addAttestationManager(address(attestationManager));
        console2.log("Granted ATTESTATION_MANAGER_ROLE to AttestationManager");
        
        // Grant log manager role to LogADog contract in AttestationManager
        attestationManager.addLogManager(address(logADog));
        console2.log("Granted LOG_MANAGER_ROLE to LogADog in AttestationManager");
        
        // Set LogADog contract in AttestationManager
        attestationManager.setLogADogContract(address(logADog));
        console2.log("Set LogADog contract in AttestationManager");
        
        // Grant deployer role to LogADog contract in CoinDeploymentManager
        coinDeploymentManager.addDeployer(address(logADog));
        console2.log("Granted DEPLOYER_ROLE to LogADog in CoinDeploymentManager");
    }
    
    function _fundRewardsPool() internal {
        console2.log("Funding initial rewards pool...");
        
        if (existingHotdogToken != address(0)) {
            // Using existing token - skip automatic funding
            console2.log("Using existing HotdogToken - skipping automatic rewards pool funding");
            console2.log("Please manually fund the rewards pool by calling:");
            console2.log("1. hotdogToken.approve(stakingContract, amount)");
            console2.log("2. stakingContract.depositRewards(amount)");
            console2.log("HotdogStaking address:", address(hotdogStaking));
            return;
        }
        
        // New token deployment - use already minted tokens for rewards pool
        // (constructor already minted all 100B tokens to deployer)
        console2.log("Using", config.initialRewardsPool / 10**18, "HOTDOG tokens from initial supply for rewards pool");
        
        // Approve and deposit rewards from deployer's balance
        hotdogToken.approve(address(hotdogStaking), config.initialRewardsPool);
        hotdogStaking.depositRewards(config.initialRewardsPool);
        
        console2.log("Deposited", config.initialRewardsPool / 10**18, "HOTDOG tokens to rewards pool");
    }
    
    function _logDeploymentInfo() internal view {
        console2.log("\n=== DEPLOYMENT COMPLETE ===");
        console2.log("Network:", config.name);
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("Platform Referrer:", config.platformReferrer);
        console2.log("\n=== CONTRACT ADDRESSES ===");
        console2.log("HotdogToken:", address(hotdogToken));
        console2.log("HotdogStaking:", address(hotdogStaking));
        console2.log("AttestationManager:", address(attestationManager));
        console2.log("CoinDeploymentManager:", address(coinDeploymentManager));
        console2.log("LogADog:", address(logADog));
        console2.log("\n=== TOKEN INFO ===");
        console2.log("Total Supply:", hotdogToken.totalSupply() / 10**18, "HOTDOG");
        console2.log("Max Supply:", 100000000000, "HOTDOG"); // 100B tokens max supply
        
        if (existingHotdogToken != address(0)) {
            console2.log("Rewards Pool: NOT FUNDED (using existing token)");
            console2.log("Please fund manually:", config.initialRewardsPool / 10**18, "HOTDOG recommended");
        } else {
            console2.log("Rewards Pool:", config.initialRewardsPool / 10**18, "HOTDOG");
        }
    }
    
    function _saveDeploymentInfo() internal {
        string memory json = string(abi.encodePacked(
            '{\n',
            '  "network": "', config.name, '",\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "platformReferrer": "', vm.toString(config.platformReferrer), '",\n',
            '  "contracts": {\n',
            '    "HotdogToken": "', vm.toString(address(hotdogToken)), '",\n',
            '    "HotdogStaking": "', vm.toString(address(hotdogStaking)), '",\n',
            '    "AttestationManager": "', vm.toString(address(attestationManager)), '",\n',
            '    "CoinDeploymentManager": "', vm.toString(address(coinDeploymentManager)), '",\n',
            '    "LogADog": "', vm.toString(address(logADog)), '"\n',
            '  },\n',
            '  "timestamp": ', vm.toString(block.timestamp), '\n',
            '}'
        ));
        
        string memory filename = string(abi.encodePacked(
            "deployments/",
            vm.toString(block.chainid),
            "-",
            vm.toString(block.timestamp),
            ".json"
        ));
        
        vm.writeFile(filename, json);
        console2.log("Deployment info saved to:", filename);
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/HotdogToken.sol";
import "../src/HotdogStaking.sol";
import "../src/AttestationManager.sol";
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
    LogADog public logADog;
    
    // Deployment configuration
    address public deployer;
    NetworkConfig public config;
    
    function run() external {
        // Get deployer address - when using --interactives flag, 
        // the private key is handled by forge automatically
        deployer = msg.sender;
        
        console2.log("Deploying with account:", deployer);
        console2.log("Account balance:", deployer.balance);
        
        // Configure network-specific settings
        _configureNetwork();
        
        vm.startBroadcast();
        
        // Deploy contracts in correct order
        _deployHotdogToken();
        _deployHotdogStaking();
        _deployAttestationManager();
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
                platformReferrer: deployer, // Use deployer as platform referrer for testnet
                initialTokenSupply: 1000000 * 10**18, // 1M tokens
                initialRewardsPool: 50000 * 10**18 // 50K tokens for rewards
            });
        } else if (chainId == 8453) {
            // Base Mainnet
            config = NetworkConfig({
                name: "Base Mainnet",
                platformReferrer: vm.envAddress("PLATFORM_REFERRER"), // Must be set in .env
                initialTokenSupply: 1000000 * 10**18, // 1M tokens
                initialRewardsPool: 100000 * 10**18 // 100K tokens for rewards
            });
        } else {
            revert("Unsupported network");
        }
        
        console2.log("Deploying to:", config.name);
        console2.log("Platform referrer:", config.platformReferrer);
    }
    
    function _deployHotdogToken() internal {
        console2.log("Deploying HotdogToken...");
        hotdogToken = new HotdogToken();
        console2.log("HotdogToken deployed at:", address(hotdogToken));
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
    
    function _deployLogADog() internal {
        console2.log("Deploying LogADog...");
        logADog = new LogADog(
            config.platformReferrer,
            address(attestationManager)
        );
        console2.log("LogADog deployed at:", address(logADog));
    }
    
    function _configureContracts() internal {
        console2.log("Configuring contracts...");
        
        // Grant minter role to staking contract for rewards
        hotdogToken.grantRole(hotdogToken.MINTER_ROLE(), address(hotdogStaking));
        console2.log("Granted MINTER_ROLE to HotdogStaking");
        
        // Grant minter role to attestation manager for rewards
        hotdogToken.grantRole(hotdogToken.MINTER_ROLE(), address(attestationManager));
        console2.log("Granted MINTER_ROLE to AttestationManager");
        
        // Grant attestation manager role to attestation manager in staking contract
        hotdogStaking.addAttestationManager(address(attestationManager));
        console2.log("Granted ATTESTATION_MANAGER_ROLE to AttestationManager");
        
        // Set LogADog contract in AttestationManager
        attestationManager.setLogADogContract(address(logADog));
        console2.log("Set LogADog contract in AttestationManager");
    }
    
    function _fundRewardsPool() internal {
        console2.log("Funding initial rewards pool...");
        
        // Mint tokens for rewards pool
        hotdogToken.mint(deployer, config.initialRewardsPool);
        
        // Approve and deposit rewards
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
        console2.log("LogADog:", address(logADog));
        console2.log("\n=== TOKEN INFO ===");
        console2.log("Total Supply:", hotdogToken.totalSupply() / 10**18, "HOTDOG");
        console2.log("Max Supply:", 10000000, "HOTDOG"); // 10M tokens max supply
        console2.log("Rewards Pool:", config.initialRewardsPool / 10**18, "HOTDOG");
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
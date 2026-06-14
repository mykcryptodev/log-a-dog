// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/HotdogToken.sol";
import "../src/HotdogStakingV2.sol";
import "../src/AttestationManager.sol";
import "../src/LogADog.sol";

contract DeploySeasonV2Script is Script {
    struct NetworkConfig {
        string name;
        uint256 initialRewardsPool;
    }

    HotdogToken public hotdogToken;
    HotdogStakingV2 public hotdogStaking;
    AttestationManager public attestationManager;
    LogADog public logADog;

    address public deployer;
    NetworkConfig public config;

    function run() external {
        deployer = msg.sender;
        _configureNetwork();

        address existingHotdogToken = vm.envAddress("EXISTING_HOTDOG_TOKEN");
        address existingLogADog = vm.envAddress("EXISTING_LOG_A_DOG");
        uint256 rewardAmount = vm.envOr("SEASON_V2_REWARDS_POOL", config.initialRewardsPool);

        hotdogToken = HotdogToken(existingHotdogToken);
        logADog = LogADog(existingLogADog);

        vm.startBroadcast();

        console2.log("Deploying Season V2 with account:", deployer);
        console2.log("Using HotdogToken:", address(hotdogToken));
        console2.log("Using LogADog:", address(logADog));

        hotdogStaking = new HotdogStakingV2(address(hotdogToken));
        attestationManager = new AttestationManager(address(hotdogStaking));

        hotdogStaking.addAttestationManager(address(attestationManager));
        attestationManager.addLogManager(address(logADog));
        attestationManager.setLogADogContract(address(logADog));
        logADog.setAttestationManager(address(attestationManager));

        if (rewardAmount > 0) {
            hotdogToken.approve(address(hotdogStaking), rewardAmount);
            hotdogStaking.depositRewards(rewardAmount);
        }

        vm.stopBroadcast();

        _logDeploymentInfo(rewardAmount);
        _saveDeploymentInfo(rewardAmount);
    }

    function _configureNetwork() internal {
        uint256 chainId = block.chainid;

        if (chainId == 84532) {
            config = NetworkConfig({
                name: "Base Sepolia",
                initialRewardsPool: 50000 * 10**18
            });
        } else if (chainId == 8453) {
            config = NetworkConfig({
                name: "Base Mainnet",
                initialRewardsPool: 100000 * 10**18
            });
        } else {
            revert("Unsupported network");
        }
    }

    function _logDeploymentInfo(uint256 rewardAmount) internal view {
        console2.log("\n=== SEASON V2 DEPLOYMENT COMPLETE ===");
        console2.log("Network:", config.name);
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("HotdogToken:", address(hotdogToken));
        console2.log("HotdogStakingV2:", address(hotdogStaking));
        console2.log("AttestationManagerV2:", address(attestationManager));
        console2.log("LogADog:", address(logADog));
        console2.log("Rewards Pool:", rewardAmount / 10**18, "HOTDOG");
        console2.log("Season Start:", hotdogStaking.SEASON_START_TIME());
        console2.log("Reward End:", hotdogStaking.REWARD_END_TIME());
    }

    function _saveDeploymentInfo(uint256 rewardAmount) internal {
        string memory json = string(abi.encodePacked(
            '{\n',
            '  "network": "', config.name, '",\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "contracts": {\n',
            '    "HotdogToken": "', vm.toString(address(hotdogToken)), '",\n',
            '    "HotdogStakingV2": "', vm.toString(address(hotdogStaking)), '",\n',
            '    "AttestationManagerV2": "', vm.toString(address(attestationManager)), '",\n',
            '    "LogADog": "', vm.toString(address(logADog)), '"\n',
            '  },\n',
            '  "seasonStartTime": ', vm.toString(hotdogStaking.SEASON_START_TIME()), ',\n',
            '  "rewardEndTime": ', vm.toString(hotdogStaking.REWARD_END_TIME()), ',\n',
            '  "rewardsPool": "', vm.toString(rewardAmount), '",\n',
            '  "timestamp": ', vm.toString(block.timestamp), '\n',
            '}'
        ));

        string memory filename = string(abi.encodePacked(
            "deployments/season-v2-",
            vm.toString(block.chainid),
            "-",
            vm.toString(block.timestamp),
            ".json"
        ));

        vm.writeFile(filename, json);
        console2.log("Deployment info saved to:", filename);
    }
}

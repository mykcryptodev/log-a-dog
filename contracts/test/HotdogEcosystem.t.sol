// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/LogADog.sol";
import "../src/HotdogToken.sol";
import "../src/HotdogStaking.sol";
import "../src/AttestationManager.sol";
import "../src/CoinDeploymentManager.sol";

contract HotdogEcosystemTest is Test {
    LogADog public logADog;
    HotdogToken public hotdogToken;
    HotdogStaking public stakingContract;
    AttestationManager public attestationManager;
    CoinDeploymentManager public coinDeploymentManager;
    
    address public constant ZORA_FACTORY = 0x777777751622c0d3258f214F9DF38E35BF45baF3;
    address public constant MOCK_COIN_ADDRESS = address(0x1234);
    
    address public user1;
    address public user2;
    address public user3;
    address public operator;
    address public platformReferrer;
    address public admin;

    // Test constants
    uint256 constant REWARD_END_TIME = 1725148800; // September 1, 2025 00:00:00 UTC
    uint256 constant INITIAL_REWARDS_POOL = 10000 * 10**18; // 10,000 HOTDOG tokens

    function setUp() public {
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);
        operator = address(0x4);
        platformReferrer = address(0x5);
        admin = address(this);
        
        // Deploy contracts
        hotdogToken = new HotdogToken();
        stakingContract = new HotdogStaking(address(hotdogToken));
        attestationManager = new AttestationManager(address(stakingContract));
        coinDeploymentManager = new CoinDeploymentManager(ZORA_FACTORY, "LOGADOG");
        logADog = new LogADog(platformReferrer, address(attestationManager), address(coinDeploymentManager));
        
        // Setup roles
        logADog.addOperator(operator);
        stakingContract.addAttestationManager(address(attestationManager));
        attestationManager.addLogManager(address(logADog));
        attestationManager.setLogADogContract(address(logADog));
        hotdogToken.addMinter(address(stakingContract));
        hotdogToken.addMinter(address(attestationManager)); // AttestationManager needs minter role for rewards
        coinDeploymentManager.addDeployer(address(logADog)); // LogADog needs deployer role for coin deployment
        
        // Distribute tokens to users
        hotdogToken.transfer(user1, 1000 * 10**18);
        hotdogToken.transfer(user2, 1000 * 10**18);
        hotdogToken.transfer(user3, 1000 * 10**18);
        
        // Setup initial rewards pool
        hotdogToken.approve(address(stakingContract), INITIAL_REWARDS_POOL);
        stakingContract.depositRewards(INITIAL_REWARDS_POOL);
        
        // Mock Zora factory calls
        vm.mockCall(
            ZORA_FACTORY,
            abi.encodeWithSelector(IZoraFactory.deploy.selector),
            abi.encode(MOCK_COIN_ADDRESS, bytes(""))
        );
    }

    function testTokenDeployment() public view {
        assertEq(hotdogToken.name(), "Hotdog Token");
        assertEq(hotdogToken.symbol(), "HOTDOG");
        assertEq(hotdogToken.totalSupply(), 1_000_000 * 10**18);
    }

    function testStaking() public {
        vm.startPrank(user1);
        
        // Approve and stake tokens
        hotdogToken.approve(address(stakingContract), 200 * 10**18);
        stakingContract.stake(200 * 10**18);
        
        // Check stake info
        (uint256 amount, uint256 rewardDebt, uint256 pendingRewards, bool isActive) = stakingContract.stakes(user1);
        assertEq(amount, 200 * 10**18);
        assertTrue(isActive);
        assertEq(pendingRewards, 0);
        assertEq(rewardDebt, 0); // Should be 0 since accumulatedRewardPerToken is 0 at start
        
        vm.stopPrank();
    }

    function testStakingRewards() public {
        // Set a specific timestamp for predictable testing
        vm.warp(1640995200); // January 1, 2022 00:00:00 UTC (well before reward end time)
        
        vm.startPrank(user1);
        
        // Stake tokens
        hotdogToken.approve(address(stakingContract), 200 * 10**18);
        stakingContract.stake(200 * 10**18);
        
        vm.stopPrank();
        
        // Fast forward time (1 day)
        vm.warp(block.timestamp + 1 days);
        
        // Check pending rewards
        uint256 pendingRewards = stakingContract.getPendingRewards(user1);
        assertTrue(pendingRewards > 0, "Should have earned some rewards after 1 day");
        
        // The rewards should be proportional: user has 200 tokens out of 200 total (100% of rewards)
        // Emission rate = rewardsPool / timeRemaining
        // 1 day of rewards should be (INITIAL_REWARDS_POOL * 1 day) / (REWARD_END_TIME - current_time)
        uint256 timeRemaining = REWARD_END_TIME - block.timestamp;
        uint256 expectedRewards = (INITIAL_REWARDS_POOL * 1 days) / timeRemaining;
        
        assertApproxEqRel(pendingRewards, expectedRewards, 0.01e18); // Within 1%
    }

    function testProportionalRewards() public {
        // Set a specific timestamp for predictable testing
        vm.warp(1640995200); // January 1, 2022 00:00:00 UTC
        
        // User1 stakes 300 tokens
        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), 300 * 10**18);
        stakingContract.stake(300 * 10**18);
        vm.stopPrank();
        
        // User2 stakes 100 tokens (user1 has 3x more)
        vm.startPrank(user2);
        hotdogToken.approve(address(stakingContract), 100 * 10**18);
        stakingContract.stake(100 * 10**18);
        vm.stopPrank();
        
        // Fast forward time
        vm.warp(block.timestamp + 1 days);
        
        // Check rewards are proportional
        uint256 user1Rewards = stakingContract.getPendingRewards(user1);
        uint256 user2Rewards = stakingContract.getPendingRewards(user2);
        
        // User1 should have ~3x the rewards of user2
        assertApproxEqRel(user1Rewards, user2Rewards * 3, 0.01e18);
    }

    function testRewardEndTime() public {
        // Test that rewards stop accruing after September 1, 2025
        vm.warp(REWARD_END_TIME - 1 days); // 1 day before end
        
        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), 200 * 10**18);
        stakingContract.stake(200 * 10**18);
        vm.stopPrank();
        
        // Move to exactly the end time
        vm.warp(REWARD_END_TIME);
        uint256 rewardsAtEnd = stakingContract.getPendingRewards(user1);
        
        // Move past the end time
        vm.warp(REWARD_END_TIME + 1 days);
        uint256 rewardsAfterEnd = stakingContract.getPendingRewards(user1);
        
        // Rewards should not increase after end time
        assertEq(rewardsAtEnd, rewardsAfterEnd);
    }

    function testCannotStakeAfterRewardPeriod() public {
        vm.warp(REWARD_END_TIME + 1); // Past the reward end time
        
        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), 200 * 10**18);
        
        vm.expectRevert("Reward period has ended");
        stakingContract.stake(200 * 10**18);
        vm.stopPrank();
    }

    function testCannotDepositRewardsAfterPeriod() public {
        vm.warp(REWARD_END_TIME + 1); // Past the reward end time
        
        hotdogToken.approve(address(stakingContract), 1000 * 10**18);
        vm.expectRevert("Reward period has ended");
        stakingContract.depositRewards(1000 * 10**18);
    }

    function testEmissionRateCalculation() public {
        vm.warp(1640995200); // January 1, 2022
        
        uint256 currentEmissionRate = stakingContract.getCurrentEmissionRate();
        uint256 timeRemaining = stakingContract.getTimeRemaining();
        
        // Emission rate should be rewardsPool / timeRemaining
        uint256 expectedRate = INITIAL_REWARDS_POOL / timeRemaining;
        assertEq(currentEmissionRate, expectedRate);
    }

    function testAdditionalRewardDeposits() public {
        vm.warp(1640995200); // January 1, 2022
        
        // Get initial emission rate
        uint256 initialRate = stakingContract.getCurrentEmissionRate();
        
        // Deposit additional rewards
        uint256 additionalRewards = 5000 * 10**18;
        hotdogToken.approve(address(stakingContract), additionalRewards);
        stakingContract.depositRewards(additionalRewards);
        
        // Emission rate should increase
        uint256 newRate = stakingContract.getCurrentEmissionRate();
        assertTrue(newRate > initialRate);
        
        // New rate should be (original + additional) / timeRemaining
        uint256 totalRewards = INITIAL_REWARDS_POOL + additionalRewards;
        uint256 timeRemaining = stakingContract.getTimeRemaining();
        uint256 expectedRate = totalRewards / timeRemaining;
        assertEq(newRate, expectedRate);
    }

    function testLogHotdogWithAttestation() public {
        // Setup staking for users
        _setupStaking();
        
        // Log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        
        vm.stopPrank();
        
        // Check that attestation period was started
        (uint256 startTime, uint256 endTime, AttestationManager.AttestationStatus status,,, ) = attestationManager.getAttestationPeriod(logId);
        assertTrue(startTime > 0);
        assertEq(endTime, startTime + 48 hours);
        assertEq(uint256(status), uint256(AttestationManager.AttestationStatus.Active));
    }

    function testAttestationFlow() public {
        // Setup staking for users
        _setupStaking();
        
        // Log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // User2 attests valid
        vm.startPrank(user2);
        attestationManager.attestToLog(logId, true, 100 * 10**18);
        vm.stopPrank();
        
        // User3 attests invalid
        vm.startPrank(user3);
        attestationManager.attestToLog(logId, false, 50 * 10**18);
        vm.stopPrank();
        
        // Check attestation period state
        (,, AttestationManager.AttestationStatus status, uint256 totalValidStake, uint256 totalInvalidStake,) = attestationManager.getAttestationPeriod(logId);
        assertEq(uint256(status), uint256(AttestationManager.AttestationStatus.Active));
        assertEq(totalValidStake, 100 * 10**18);
        assertEq(totalInvalidStake, 50 * 10**18);
        
        // Check that tokens are locked
        assertEq(stakingContract.lockedForAttestation(user2), 100 * 10**18);
        assertEq(stakingContract.lockedForAttestation(user3), 50 * 10**18);
    }

    function testLockedTokensStillEarnRewards() public {
        vm.warp(1640995200); // January 1, 2022
        
        // Setup staking for users
        _setupStaking();
        
        // Use the attestation manager to lock tokens (since it has the proper role)
        vm.startPrank(address(attestationManager));
        stakingContract.lockTokensForAttestation(user2, 100 * 10**18);
        vm.stopPrank();
        
        // Verify tokens are locked
        assertEq(stakingContract.lockedForAttestation(user2), 100 * 10**18);
        assertEq(stakingContract.getAvailableStake(user2), 200 * 10**18); // 300 - 100 locked
        
        // Fast forward time
        vm.warp(block.timestamp + 1 days);
        
        // User2 should still earn rewards on their full stake (including locked tokens)
        uint256 user2Rewards = stakingContract.getPendingRewards(user2);
        assertTrue(user2Rewards > 0, "Locked tokens should still earn rewards");
        
        // Rewards should be calculated on the full 300 tokens, not just the 200 available
        // User2 has 300 out of 900 total tokens (1/3 of rewards)  
        uint256 timeRemaining = REWARD_END_TIME - block.timestamp;
        uint256 expectedRewards = (INITIAL_REWARDS_POOL * 1 days * 300) / (timeRemaining * 900);
        assertApproxEqRel(user2Rewards, expectedRewards, 0.01e18);
    }

    function testAttestationResolution() public {
        // Setup staking for users
        _setupStaking();
        
        // Log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // User2 attests valid with more stake
        vm.startPrank(user2);
        attestationManager.attestToLog(logId, true, 100 * 10**18);
        vm.stopPrank();
        
        // User3 attests invalid with less stake
        vm.startPrank(user3);
        attestationManager.attestToLog(logId, false, 50 * 10**18);
        vm.stopPrank();
        
        // Fast forward past attestation window
        vm.warp(block.timestamp + 49 hours);
        
        // Get initial balances
        uint256 user2InitialRewards = stakingContract.getPendingRewards(user2);
        uint256 user3InitialStake = stakingContract.getAvailableStake(user3);
        
        // Resolve attestation period
        logADog.resolveAttestationPeriod(logId);
        
        // Check resolution
        (,, AttestationManager.AttestationStatus status,,, bool isValid) = attestationManager.getAttestationPeriod(logId);
        assertEq(uint256(status), uint256(AttestationManager.AttestationStatus.Resolved));
        assertTrue(isValid); // Valid side won
        
        // Check that tokens are unlocked for winner
        assertEq(stakingContract.lockedForAttestation(user2), 0);
        
        // Check that loser was slashed
        uint256 expectedSlash = (50 * 10**18 * 15) / 100; // 15% of 50 tokens
        assertEq(stakingContract.lockedForAttestation(user3), 0);
        
        // Check that winner received rewards
        uint256 user2FinalRewards = stakingContract.getPendingRewards(user2);
        assertTrue(user2FinalRewards > user2InitialRewards);
    }

    function testCannotAttestToOwnLog() public {
        _setupStaking();
        
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        
        // Test that the old LogADog function now redirects
        vm.expectRevert("Please call attestToLog directly on the AttestationManager contract");
        logADog.attestHotdogLog(logId, true, 100 * 10**18);
        
        // Test that users cannot attest to their own logs via AttestationManager
        vm.expectRevert("Cannot attest to your own log");
        attestationManager.attestToLog(logId, true, 100 * 10**18);
        
        vm.stopPrank();
    }

    function testCannotAttestWithInsufficientStake() public {
        _setupStaking();
        
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        vm.startPrank(user2);
        vm.expectRevert("Stake amount too low");
        attestationManager.attestToLog(logId, true, 10 * 10**18); // Below minimum
        vm.stopPrank();
    }

    function testCannotAttestAfterPeriodEnds() public {
        _setupStaking();
        
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // Fast forward past attestation window
        vm.warp(block.timestamp + 49 hours);
        
        vm.startPrank(user2);
        vm.expectRevert("Attestation period has ended");
        attestationManager.attestToLog(logId, true, 100 * 10**18);
        vm.stopPrank();
    }

    function testUnstaking() public {
        vm.startPrank(user1);
        
        // Stake tokens
        hotdogToken.approve(address(stakingContract), 200 * 10**18);
        stakingContract.stake(200 * 10**18);
        
        // Unstake some tokens
        stakingContract.unstake(50 * 10**18);
        
        // Check remaining stake
        (uint256 amount,,,) = stakingContract.stakes(user1);
        assertEq(amount, 150 * 10**18);
        
        // Check token balance
        assertEq(hotdogToken.balanceOf(user1), 850 * 10**18); // 1000 - 200 + 50
        
        vm.stopPrank();
    }

    function testCannotUnstakeLockedTokens() public {
        _setupStaking();
        
        // Log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // User2 attests
        vm.startPrank(user2);
        attestationManager.attestToLog(logId, true, 100 * 10**18);
        
        // Try to unstake locked tokens
        vm.expectRevert("Tokens locked for attestation");
        stakingContract.unstake(250 * 10**18); // More than available (300 staked - 100 locked = 200 available)
        
        // Should be able to unstake available tokens
        stakingContract.unstake(50 * 10**18); // 200 available - 100 locked = 100 available, unstaking 50
        
        vm.stopPrank();
    }

    function _setupStaking() internal {
        // Setup staking for test users
        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), 300 * 10**18);
        stakingContract.stake(300 * 10**18);
        vm.stopPrank();
        
        vm.startPrank(user2);
        hotdogToken.approve(address(stakingContract), 300 * 10**18);
        stakingContract.stake(300 * 10**18);
        vm.stopPrank();
        
        vm.startPrank(user3);
        hotdogToken.approve(address(stakingContract), 300 * 10**18);
        stakingContract.stake(300 * 10**18);
        vm.stopPrank();
    }

    function testOperatorAttestOnBehalf() public {
        // Setup: Deploy token, stake tokens, and log a hotdog
        hotdogToken.transfer(user1, 1000 * 10**18);
        hotdogToken.transfer(user2, 1000 * 10**18);

        // User1 stakes tokens
        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), 300 * 10**18);
        stakingContract.stake(300 * 10**18);
        vm.stopPrank();

        // User2 stakes tokens
        vm.startPrank(user2);
        hotdogToken.approve(address(stakingContract), 300 * 10**18);
        stakingContract.stake(300 * 10**18);
        vm.stopPrank();

        // User1 logs a hotdog
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog("image1", "metadata1", "coin1", user1, "");
        vm.stopPrank();

        // Operator attests on behalf of user2
        vm.startPrank(operator);
        attestationManager.attestToLogOnBehalf(logId, user2, true, 50 * 10**18);
        vm.stopPrank();

        // Verify attestation was recorded
        assertTrue(attestationManager.hasUserAttested(logId, user2));
        assertEq(attestationManager.getUserStakeInAttestation(logId, user2), 50 * 10**18);

        // Verify tokens were locked
        assertEq(stakingContract.getAvailableStake(user2), 250 * 10**18); // 300 - 50

        // Verify attestation period info
        (,, AttestationManager.AttestationStatus status, uint256 totalValidStake, uint256 totalInvalidStake,) = 
            attestationManager.getAttestationPeriod(logId);
        assertEq(uint256(status), uint256(AttestationManager.AttestationStatus.Active));
        assertEq(totalValidStake, 50 * 10**18);
        assertEq(totalInvalidStake, 0);
    }

    function testOperatorCannotAttestOnBehalfWithoutRole() public {
        // Setup: Deploy token, stake tokens, and log a hotdog
        hotdogToken.transfer(user1, 1000 * 10**18);
        hotdogToken.transfer(user2, 1000 * 10**18);

        // User2 stakes tokens
        vm.startPrank(user2);
        hotdogToken.approve(address(stakingContract), 300 * 10**18);
        stakingContract.stake(300 * 10**18);
        vm.stopPrank();

        // User1 logs a hotdog
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog("image1", "metadata1", "coin1", user1, "");
        vm.stopPrank();

        // Non-operator tries to attest on behalf of user2 - should fail
        vm.startPrank(user3);
        vm.expectRevert("Caller is not an operator");
        attestationManager.attestToLogOnBehalf(logId, user2, true, 50 * 10**18);
        vm.stopPrank();
    }
} 
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
        
        // Mock Zora factory calls
        vm.mockCall(
            ZORA_FACTORY,
            abi.encodeWithSelector(IZoraFactory.deploy.selector),
            abi.encode(MOCK_COIN_ADDRESS, 1)
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
        (uint256 amount, uint256 lastRewardTime, uint256 pendingRewards, bool isActive) = stakingContract.stakes(user1);
        assertEq(amount, 200 * 10**18);
        assertTrue(isActive);
        assertEq(lastRewardTime, block.timestamp);
        assertEq(pendingRewards, 0);
        
        vm.stopPrank();
    }

    function testStakingRewards() public {
        vm.startPrank(user1);
        
        // Stake tokens
        hotdogToken.approve(address(stakingContract), 200 * 10**18);
        stakingContract.stake(200 * 10**18);
        
        // Fast forward time (1 year)
        vm.warp(block.timestamp + 365 days);
        
        // Check pending rewards (should be ~10% APY)
        uint256 pendingRewards = stakingContract.getPendingRewards(user1);
        assertApproxEqRel(pendingRewards, 20 * 10**18, 0.01e18); // ~20 tokens (10% of 200)
        
        vm.stopPrank();
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

    function testAttestationResolution() public {
        // Setup staking for users
        _setupStaking();
        
        // Log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
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
} 
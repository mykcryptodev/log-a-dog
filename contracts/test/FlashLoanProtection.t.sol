// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/HotdogStaking.sol";
import "../src/HotdogToken.sol";

/**
 * @title FlashLoanProtectionTest
 * @dev Tests to verify that the minimum staking duration prevents flash loan attacks
 */
contract FlashLoanProtectionTest is Test {
    HotdogStaking public stakingContract;
    HotdogToken public hotdogToken;
    
    address public user1;
    address public user2;
    address public admin;
    
    uint256 constant INITIAL_REWARDS_POOL = 10000 * 10**18;
    uint256 constant STAKE_AMOUNT = 1000 * 10**18;
    
    function setUp() public {
        admin = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        // Deploy contracts
        hotdogToken = new HotdogToken();
        stakingContract = new HotdogStaking(address(hotdogToken));
        
        // Setup initial rewards pool
        hotdogToken.approve(address(stakingContract), INITIAL_REWARDS_POOL);
        stakingContract.depositRewards(INITIAL_REWARDS_POOL);
        
        // Distribute tokens to users
        hotdogToken.transfer(user1, STAKE_AMOUNT);
        hotdogToken.transfer(user2, STAKE_AMOUNT);
    }
    
    function testCannotUnstakeImmediately() public {
        vm.startPrank(user1);
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        
        // Try to unstake immediately - should fail
        vm.expectRevert("Minimum stake duration not met");
        stakingContract.unstake(STAKE_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testCanUnstakeAfterMinimumDuration() public {
        vm.startPrank(user1);
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        
        // Fast forward past minimum duration (1 hour)
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Should be able to unstake now
        stakingContract.unstake(STAKE_AMOUNT);
        
        // Check that tokens were returned
        assertEq(hotdogToken.balanceOf(user1), STAKE_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testStakeTimestampUpdatesOnAdditionalStake() public {
        vm.startPrank(user1);
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT / 2);
        
        // Fast forward 30 minutes
        vm.warp(block.timestamp + 30 minutes);
        
        // Stake additional tokens (this should update the timestamp)
        stakingContract.stake(STAKE_AMOUNT / 2);
        
        // Try to unstake immediately - should fail because timestamp was updated
        vm.expectRevert("Minimum stake duration not met");
        stakingContract.unstake(STAKE_AMOUNT);
        
        // Fast forward another hour from the second stake
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Should be able to unstake now
        stakingContract.unstake(STAKE_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testCanUnstakeNowFunction() public {
        vm.startPrank(user1);
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        
        // Should not be able to unstake immediately
        assertFalse(stakingContract.canUnstakeNow(user1));
        
        // Fast forward past minimum duration
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Should be able to unstake now
        assertTrue(stakingContract.canUnstakeNow(user1));
        
        vm.stopPrank();
    }
    
    function testGetUnstakeAvailableTime() public {
        vm.startPrank(user1);
        
        uint256 stakeTime = block.timestamp;
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        
        // Check unstake available time
        uint256 expectedTime = stakeTime + 1 hours;
        assertEq(stakingContract.getUnstakeAvailableTime(user1), expectedTime);
        
        vm.stopPrank();
    }
    
    function testFlashLoanAttackPrevented() public {
        // This test simulates a flash loan attack scenario
        vm.startPrank(user1);
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        
        // In the same transaction, try to unstake (simulating flash loan)
        vm.expectRevert("Minimum stake duration not met");
        stakingContract.unstake(STAKE_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testPartialUnstakeAfterDuration() public {
        vm.startPrank(user1);
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        
        // Fast forward past minimum duration
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Unstake half
        stakingContract.unstake(STAKE_AMOUNT / 2);
        
        // Check remaining stake
        (uint256 amount,,,, uint256 stakeTimestamp) = stakingContract.stakes(user1);
        assertEq(amount, STAKE_AMOUNT / 2);
        assertTrue(stakeTimestamp > 0); // Timestamp should still be set
        
        // Should be able to unstake the rest immediately since timestamp hasn't changed
        stakingContract.unstake(STAKE_AMOUNT / 2);
        
        vm.stopPrank();
    }
    
    function testTimestampResetWhenFullyUnstaked() public {
        vm.startPrank(user1);
        
        // User stakes tokens
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        
        // Fast forward past minimum duration
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Unstake all tokens
        stakingContract.unstake(STAKE_AMOUNT);
        
        // Check that timestamp is reset
        (uint256 amount,,,, uint256 stakeTimestamp) = stakingContract.stakes(user1);
        assertEq(amount, 0);
        assertEq(stakeTimestamp, 0);
        
        vm.stopPrank();
    }
} 
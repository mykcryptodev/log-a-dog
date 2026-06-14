// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/HotdogStakingV2.sol";
import "../src/HotdogToken.sol";

contract HotdogStakingV2Test is Test {
    HotdogStakingV2 public stakingContract;
    HotdogToken public hotdogToken;

    address public user1 = address(0x1);
    address public manager = address(0x2);

    uint256 constant INITIAL_REWARDS_POOL = 10000 * 10**18;
    uint256 constant STAKE_AMOUNT = 300000 * 10**18;

    function setUp() public {
        hotdogToken = new HotdogToken();
        stakingContract = new HotdogStakingV2(address(hotdogToken));
        stakingContract.addAttestationManager(manager);

        hotdogToken.transfer(user1, STAKE_AMOUNT);
        hotdogToken.approve(address(stakingContract), INITIAL_REWARDS_POOL);
        stakingContract.depositRewards(INITIAL_REWARDS_POOL);
    }

    function testCanFundRewardsBeforeSeasonStarts() public view {
        assertEq(stakingContract.rewardsPool(), INITIAL_REWARDS_POOL);
        assertEq(stakingContract.getCurrentEmissionRate(), 0);
    }

    function testCannotStakeBeforeSeasonStarts() public {
        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        vm.expectRevert("Season has not started");
        stakingContract.stake(STAKE_AMOUNT);
        vm.stopPrank();
    }

    function testCanStakeDuringSeason() public {
        vm.warp(stakingContract.SEASON_START_TIME());

        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        vm.stopPrank();

        (uint256 amount,,,, uint256 stakeTimestamp) = stakingContract.stakes(user1);
        assertEq(amount, STAKE_AMOUNT);
        assertEq(stakeTimestamp, stakingContract.SEASON_START_TIME());
    }

    function testRewardsAccrueDuringSeasonOnly() public {
        vm.warp(stakingContract.SEASON_START_TIME());

        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days);
        uint256 rewardsDuringSeason = stakingContract.getPendingRewards(user1);
        assertTrue(rewardsDuringSeason > 0, "rewards should accrue during season");

        vm.warp(stakingContract.REWARD_END_TIME());
        uint256 rewardsAtEnd = stakingContract.getPendingRewards(user1);

        vm.warp(stakingContract.REWARD_END_TIME() + 7 days);
        assertEq(stakingContract.getPendingRewards(user1), rewardsAtEnd);
    }

    function testCannotStakeOrDepositAfterSeasonEnds() public {
        vm.warp(stakingContract.REWARD_END_TIME() + 1);

        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        vm.expectRevert("Reward period has ended");
        stakingContract.stake(STAKE_AMOUNT);
        vm.stopPrank();

        hotdogToken.approve(address(stakingContract), 1);
        vm.expectRevert("Reward period has ended");
        stakingContract.depositRewards(1);
    }

    function testCanUnstakeAndClaimAfterSeasonEnds() public {
        vm.warp(stakingContract.SEASON_START_TIME());

        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.warp(stakingContract.REWARD_END_TIME() + 1 hours + 1);

        vm.startPrank(user1);
        stakingContract.unstake(STAKE_AMOUNT);
        stakingContract.claimRewards();
        vm.stopPrank();

        (uint256 amount,,,,) = stakingContract.stakes(user1);
        assertEq(amount, 0);
        assertTrue(hotdogToken.balanceOf(user1) > STAKE_AMOUNT);
    }

    function testAttestationRoleCanLockAndSlashDuringSeason() public {
        vm.warp(stakingContract.SEASON_START_TIME());

        vm.startPrank(user1);
        hotdogToken.approve(address(stakingContract), STAKE_AMOUNT);
        stakingContract.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.startPrank(manager);
        stakingContract.lockTokensForAttestation(user1, 30000 * 10**18);
        stakingContract.slashTokens(user1, 4500 * 10**18);
        vm.stopPrank();

        (uint256 amount,,,,) = stakingContract.stakes(user1);
        assertEq(amount, STAKE_AMOUNT - 4500 * 10**18);
        assertEq(stakingContract.rewardsPool(), INITIAL_REWARDS_POOL + 4500 * 10**18);
    }
}

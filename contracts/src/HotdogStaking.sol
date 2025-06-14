// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./HotdogToken.sol";

/**
 * @title HotdogStaking
 * @dev Staking contract for HOTDOG tokens with proportional rewards that fully deplete by September 1, 2025
 */
contract HotdogStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant ATTESTATION_MANAGER_ROLE = keccak256("ATTESTATION_MANAGER_ROLE");
    
    HotdogToken public immutable hotdogToken;
    
    // Staking parameters
    uint256 public constant MINIMUM_STAKE = 100 * 10**18; // 100 HOTDOG minimum
    uint256 public constant REWARD_END_TIME = 1725148800; // September 1, 2025 00:00:00 UTC
    uint256 public constant SLASH_PERCENTAGE = 15; // 15% slashing for wrong attestations
    uint256 private constant PRECISION = 1e18; // Precision for reward calculations
    
    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt; // User's reward debt for accurate proportional calculation
        uint256 pendingRewards;
        bool isActive;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public lockedForAttestation; // Tokens locked for active attestations
    
    uint256 public totalStaked;
    uint256 public rewardsPool;
    uint256 public lastRewardUpdate; // Global timestamp for reward calculations
    uint256 public accumulatedRewardPerToken; // Global reward accumulator
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TokensSlashed(address indexed user, uint256 amount);
    event TokensLocked(address indexed user, uint256 amount);
    event TokensUnlocked(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 amount);
    event GlobalRewardsUpdated(uint256 accumulatedRewardPerToken, uint256 remainingPool);
    
    constructor(address _hotdogToken) {
        hotdogToken = HotdogToken(_hotdogToken);
        lastRewardUpdate = block.timestamp;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Update global reward state and calculate emission rate
     */
    function updateGlobalRewards() internal {
        if (block.timestamp >= REWARD_END_TIME || totalStaked == 0 || rewardsPool == 0) {
            lastRewardUpdate = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed == 0) return;
        
        uint256 timeRemaining = REWARD_END_TIME - block.timestamp;
        if (timeRemaining == 0) {
            lastRewardUpdate = block.timestamp;
            return;
        }
        
        // Calculate emission rate: rewards per second = rewardsPool / timeRemaining
        uint256 rewardsToDistribute = (rewardsPool * timeElapsed) / timeRemaining;
        
        // Ensure we don't distribute more than available
        if (rewardsToDistribute > rewardsPool) {
            rewardsToDistribute = rewardsPool;
        }
        
        // Update accumulated reward per token
        accumulatedRewardPerToken += (rewardsToDistribute * PRECISION) / totalStaked;
        rewardsPool -= rewardsToDistribute;
        lastRewardUpdate = block.timestamp;
        
        emit GlobalRewardsUpdated(accumulatedRewardPerToken, rewardsPool);
    }
    
    /**
     * @notice Update user rewards based on their stake proportion
     */
    function updateUserRewards(address user) internal {
        updateGlobalRewards();
        
        StakeInfo storage userStake = stakes[user];
        if (userStake.amount > 0) {
            uint256 accumulatedRewards = (userStake.amount * accumulatedRewardPerToken) / PRECISION;
            uint256 pending = accumulatedRewards - userStake.rewardDebt;
            userStake.pendingRewards += pending;
        }
        
        userStake.rewardDebt = (userStake.amount * accumulatedRewardPerToken) / PRECISION;
    }
    
    /**
     * @notice Stake HOTDOG tokens
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= MINIMUM_STAKE, "Amount below minimum stake");
        require(block.timestamp < REWARD_END_TIME, "Reward period has ended");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Update rewards before changing stake
        updateUserRewards(msg.sender);
        
        IERC20(address(hotdogToken)).safeTransferFrom(msg.sender, address(this), amount);
        
        if (userStake.isActive) {
            userStake.amount += amount;
        } else {
            userStake.amount = amount;
            userStake.isActive = true;
        }
        
        totalStaked += amount;
        
        // Update reward debt after stake change
        userStake.rewardDebt = (userStake.amount * accumulatedRewardPerToken) / PRECISION;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Unstake HOTDOG tokens
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.isActive, "No active stake");
        require(amount <= userStake.amount, "Insufficient staked amount");
        require(amount <= getAvailableStake(msg.sender), "Tokens locked for attestation");
        
        // Update rewards before changing stake
        updateUserRewards(msg.sender);
        
        userStake.amount -= amount;
        totalStaked -= amount;
        
        if (userStake.amount == 0) {
            userStake.isActive = false;
            userStake.rewardDebt = 0;
        } else {
            // Update reward debt after stake change
            userStake.rewardDebt = (userStake.amount * accumulatedRewardPerToken) / PRECISION;
        }
        
        IERC20(address(hotdogToken)).safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @notice Claim pending rewards
     */
    function claimRewards() external nonReentrant {
        updateUserRewards(msg.sender);
        
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 rewards = userStake.pendingRewards;
        require(rewards > 0, "No rewards to claim");
        
        userStake.pendingRewards = 0;
        
        IERC20(address(hotdogToken)).safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @notice Lock tokens for attestation (only attestation manager)
     * @param user User whose tokens to lock
     * @param amount Amount to lock
     */
    function lockTokensForAttestation(address user, uint256 amount) external onlyRole(ATTESTATION_MANAGER_ROLE) {
        require(amount <= getAvailableStake(user), "Insufficient available stake");
        lockedForAttestation[user] += amount;
        emit TokensLocked(user, amount);
    }
    
    /**
     * @notice Unlock tokens after attestation (only attestation manager)
     * @param user User whose tokens to unlock
     * @param amount Amount to unlock
     */
    function unlockTokensFromAttestation(address user, uint256 amount) external onlyRole(ATTESTATION_MANAGER_ROLE) {
        require(lockedForAttestation[user] >= amount, "Insufficient locked tokens");
        lockedForAttestation[user] -= amount;
        emit TokensUnlocked(user, amount);
    }
    
    /**
     * @notice Slash tokens for wrong attestation (only attestation manager)
     * @param user User whose tokens to slash
     * @param amount Amount to slash
     */
    function slashTokens(address user, uint256 amount) external onlyRole(ATTESTATION_MANAGER_ROLE) {
        require(lockedForAttestation[user] >= amount, "Insufficient locked tokens");
        
        StakeInfo storage userStake = stakes[user];
        require(userStake.amount >= amount, "Insufficient staked tokens");
        
        // Update rewards before slashing
        updateUserRewards(user);
        
        userStake.amount -= amount;
        lockedForAttestation[user] -= amount;
        totalStaked -= amount;
        
        // Add slashed tokens to rewards pool
        rewardsPool += amount;
        
        if (userStake.amount == 0) {
            userStake.isActive = false;
            userStake.rewardDebt = 0;
        } else {
            // Update reward debt after stake change
            userStake.rewardDebt = (userStake.amount * accumulatedRewardPerToken) / PRECISION;
        }
        
        emit TokensSlashed(user, amount);
    }
    
    /**
     * @notice Distribute rewards to winners (only attestation manager)
     * @param winners Array of winner addresses
     * @param amounts Array of reward amounts
     */
    function distributeAttestationRewards(address[] calldata winners, uint256[] calldata amounts) external onlyRole(ATTESTATION_MANAGER_ROLE) {
        require(winners.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < winners.length; i++) {
            if (amounts[i] > 0) {
                stakes[winners[i]].pendingRewards += amounts[i];
            }
        }
    }
    
    /**
     * @notice Deposit rewards to the pool (admin only)
     * @param amount Amount of rewards to deposit
     */
    function depositRewards(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(block.timestamp < REWARD_END_TIME, "Reward period has ended");
        
        // Update global rewards before adding to pool
        updateGlobalRewards();
        
        IERC20(address(hotdogToken)).safeTransferFrom(msg.sender, address(this), amount);
        rewardsPool += amount;
        emit RewardsDeposited(amount);
    }
    
    /**
     * @notice Add attestation manager
     * @param manager Address to grant attestation manager role
     */
    function addAttestationManager(address manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ATTESTATION_MANAGER_ROLE, manager);
    }
    
    /**
     * @notice Get available stake (not locked for attestation)
     * @param user User address
     * @return Available stake amount
     */
    function getAvailableStake(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (!userStake.isActive) return 0;
        return userStake.amount - lockedForAttestation[user];
    }
    
    /**
     * @notice Get pending rewards for a user
     * @param user User address
     * @return Pending rewards amount
     */
    function getPendingRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        uint256 pending = userStake.pendingRewards;
        
        if (!userStake.isActive || userStake.amount == 0 || totalStaked == 0 || rewardsPool == 0) {
            return pending;
        }
        
        // Calculate new rewards since last update
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed > 0 && block.timestamp < REWARD_END_TIME) {
            uint256 timeRemaining = REWARD_END_TIME - block.timestamp;
            if (timeRemaining > 0) {
                uint256 rewardsToDistribute = (rewardsPool * timeElapsed) / timeRemaining;
                if (rewardsToDistribute > rewardsPool) {
                    rewardsToDistribute = rewardsPool;
                }
                
                uint256 newAccumulatedRewardPerToken = accumulatedRewardPerToken + 
                    (rewardsToDistribute * PRECISION) / totalStaked;
                
                uint256 accumulatedRewards = (userStake.amount * newAccumulatedRewardPerToken) / PRECISION;
                pending += accumulatedRewards - userStake.rewardDebt;
            }
        }
        
        return pending;
    }
    
    /**
     * @notice Check if user can participate in attestations
     * @param user User address
     * @param requiredStake Required stake amount
     * @return Whether user can participate
     */
    function canParticipateInAttestation(address user, uint256 requiredStake) external view returns (bool) {
        return getAvailableStake(user) >= requiredStake;
    }
    
    /**
     * @notice Get current emission rate (rewards per second)
     * @return Current emission rate
     */
    function getCurrentEmissionRate() external view returns (uint256) {
        if (block.timestamp >= REWARD_END_TIME || rewardsPool == 0) {
            return 0;
        }
        
        uint256 timeRemaining = REWARD_END_TIME - block.timestamp;
        return rewardsPool / timeRemaining;
    }
    
    /**
     * @notice Get time remaining until reward period ends
     * @return Time remaining in seconds
     */
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= REWARD_END_TIME) {
            return 0;
        }
        return REWARD_END_TIME - block.timestamp;
    }
} 
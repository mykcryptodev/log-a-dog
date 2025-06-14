// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./HotdogToken.sol";

/**
 * @title HotdogStaking
 * @dev Staking contract for HOTDOG tokens with rewards and slashing for attestations
 */
contract HotdogStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant ATTESTATION_MANAGER_ROLE = keccak256("ATTESTATION_MANAGER_ROLE");
    
    HotdogToken public immutable hotdogToken;
    
    // Staking parameters
    uint256 public constant MINIMUM_STAKE = 100 * 10**18; // 100 HOTDOG minimum
    uint256 public constant REWARDS_RATE = 10; // 10% APY base rate
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant SLASH_PERCENTAGE = 15; // 15% slashing for wrong attestations
    
    struct StakeInfo {
        uint256 amount;
        uint256 lastRewardTime;
        uint256 pendingRewards;
        bool isActive;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public lockedForAttestation; // Tokens locked for active attestations
    
    uint256 public totalStaked;
    uint256 public rewardsPool;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TokensSlashed(address indexed user, uint256 amount);
    event TokensLocked(address indexed user, uint256 amount);
    event TokensUnlocked(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 amount);
    
    constructor(address _hotdogToken) {
        hotdogToken = HotdogToken(_hotdogToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Stake HOTDOG tokens
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= MINIMUM_STAKE, "Amount below minimum stake");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        IERC20(address(hotdogToken)).safeTransferFrom(msg.sender, address(this), amount);
        
        if (userStake.isActive) {
            userStake.amount += amount;
        } else {
            userStake.amount = amount;
            userStake.lastRewardTime = block.timestamp;
            userStake.isActive = true;
        }
        
        totalStaked += amount;
        
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
        _updateRewards(msg.sender);
        
        userStake.amount -= amount;
        totalStaked -= amount;
        
        if (userStake.amount == 0) {
            userStake.isActive = false;
        }
        
        IERC20(address(hotdogToken)).safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @notice Claim pending rewards
     */
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 rewards = userStake.pendingRewards;
        require(rewards > 0, "No rewards to claim");
        require(rewards <= rewardsPool, "Insufficient rewards pool");
        
        userStake.pendingRewards = 0;
        rewardsPool -= rewards;
        
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
        _updateRewards(user);
        
        userStake.amount -= amount;
        lockedForAttestation[user] -= amount;
        totalStaked -= amount;
        
        // Add slashed tokens to rewards pool
        rewardsPool += amount;
        
        if (userStake.amount == 0) {
            userStake.isActive = false;
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
        if (!userStake.isActive || userStake.amount == 0) return userStake.pendingRewards;
        
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        uint256 newRewards = (userStake.amount * REWARDS_RATE * timeElapsed) / (100 * SECONDS_PER_YEAR);
        
        return userStake.pendingRewards + newRewards;
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
     * @notice Update rewards for a user
     * @param user User address
     */
    function _updateRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        if (!userStake.isActive || userStake.amount == 0) return;
        
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        if (timeElapsed > 0) {
            uint256 newRewards = (userStake.amount * REWARDS_RATE * timeElapsed) / (100 * SECONDS_PER_YEAR);
            userStake.pendingRewards += newRewards;
            userStake.lastRewardTime = block.timestamp;
        }
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./HotdogStaking.sol";

interface ILogADog {
    function hotdogLogs(uint256 logId) external view returns (
        uint256 id,
        string memory imageUri,
        string memory metadataUri,
        uint256 timestamp,
        address eater,
        address logger,
        address zoraCoin
    );
}

/**
 * @title AttestationManager
 * @dev Manages attestation periods, voting, and dispute resolution for hotdog logs
 */
contract AttestationManager is AccessControl, ReentrancyGuard {
    bytes32 public constant LOG_MANAGER_ROLE = keccak256("LOG_MANAGER_ROLE");
    
    HotdogStaking public immutable stakingContract;
    ILogADog public logADogContract;
    
    // Attestation parameters
    uint256 public constant ATTESTATION_WINDOW = 48 hours;
    uint256 public constant MINIMUM_ATTESTATION_STAKE = 50 * 10**18; // 50 HOTDOG
    uint256 public constant SLASH_PERCENTAGE = 15; // 15% of staked amount
    
    enum AttestationStatus {
        Active,
        Resolved,
        Disputed
    }
    
    struct AttestationPeriod {
        uint256 logId;
        uint256 startTime;
        uint256 endTime;
        AttestationStatus status;
        uint256 totalValidStake;
        uint256 totalInvalidStake;
        address[] validAttestors;
        address[] invalidAttestors;
        mapping(address => uint256) attestorStakes;
        mapping(address => bool) hasAttested;
        bool isValid; // Final result
    }
    
    mapping(uint256 => AttestationPeriod) public attestationPeriods;
    mapping(address => uint256[]) public userAttestations; // Track user's active attestations
    
    event AttestationPeriodStarted(uint256 indexed logId, uint256 startTime, uint256 endTime);
    event AttestationMade(uint256 indexed logId, address indexed attestor, bool isValid, uint256 stakeAmount);
    event AttestationPeriodResolved(uint256 indexed logId, bool isValid, uint256 totalValidStake, uint256 totalInvalidStake);
    event RewardsDistributed(uint256 indexed logId, address[] winners, uint256[] amounts);
    event TokensSlashed(uint256 indexed logId, address[] losers, uint256[] amounts);
    
    constructor(address _stakingContract) {
        stakingContract = HotdogStaking(_stakingContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Set the LogADog contract address
     * @param _logADogContract Address of the LogADog contract
     */
    function setLogADogContract(address _logADogContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        logADogContract = ILogADog(_logADogContract);
    }
    
    /**
     * @notice Start an attestation period for a hotdog log
     * @param logId The ID of the hotdog log
     */
    function startAttestationPeriod(uint256 logId) external onlyRole(LOG_MANAGER_ROLE) {
        require(attestationPeriods[logId].startTime == 0, "Attestation period already exists");
        
        AttestationPeriod storage period = attestationPeriods[logId];
        period.logId = logId;
        period.startTime = block.timestamp;
        period.endTime = block.timestamp + ATTESTATION_WINDOW;
        period.status = AttestationStatus.Active;
        
        emit AttestationPeriodStarted(logId, period.startTime, period.endTime);
    }
    
    /**
     * @notice Attest to a hotdog log's validity
     * @param logId The ID of the hotdog log
     * @param isValid Whether the log is valid
     * @param stakeAmount Amount of tokens to stake on this attestation
     */
    function attestToLog(uint256 logId, bool isValid, uint256 stakeAmount) external nonReentrant {
        AttestationPeriod storage period = attestationPeriods[logId];
        require(period.startTime > 0, "Attestation period does not exist");
        require(block.timestamp <= period.endTime, "Attestation period has ended");
        require(period.status == AttestationStatus.Active, "Attestation period not active");
        require(!period.hasAttested[msg.sender], "Already attested to this log");
        require(stakeAmount >= MINIMUM_ATTESTATION_STAKE, "Stake amount too low");
        
        // Check that user is not attesting to their own log
        if (address(logADogContract) != address(0)) {
            (,,,, address eater,,) = logADogContract.hotdogLogs(logId);
            require(eater != msg.sender, "Cannot attest to your own log");
        }
        
        // Check if user has enough available stake
        require(stakingContract.canParticipateInAttestation(msg.sender, stakeAmount), "Insufficient available stake");
        
        // Lock tokens for this attestation
        stakingContract.lockTokensForAttestation(msg.sender, stakeAmount);
        
        // Record attestation
        period.hasAttested[msg.sender] = true;
        period.attestorStakes[msg.sender] = stakeAmount;
        
        if (isValid) {
            period.validAttestors.push(msg.sender);
            period.totalValidStake += stakeAmount;
        } else {
            period.invalidAttestors.push(msg.sender);
            period.totalInvalidStake += stakeAmount;
        }
        
        // Track user's attestations
        userAttestations[msg.sender].push(logId);
        
        emit AttestationMade(logId, msg.sender, isValid, stakeAmount);
    }
    
    /**
     * @notice Resolve an attestation period after it has ended
     * @param logId The ID of the hotdog log
     */
    function resolveAttestationPeriod(uint256 logId) external nonReentrant {
        AttestationPeriod storage period = attestationPeriods[logId];
        require(period.startTime > 0, "Attestation period does not exist");
        require(block.timestamp > period.endTime, "Attestation period still active");
        require(period.status == AttestationStatus.Active, "Already resolved");
        
        // Determine the winning side
        bool logIsValid = period.totalValidStake >= period.totalInvalidStake;
        period.isValid = logIsValid;
        period.status = AttestationStatus.Resolved;
        
        // Calculate rewards and slashing
        address[] memory winners = logIsValid ? period.validAttestors : period.invalidAttestors;
        address[] memory losers = logIsValid ? period.invalidAttestors : period.validAttestors;
        uint256 totalWinningStake = logIsValid ? period.totalValidStake : period.totalInvalidStake;
        uint256 totalLosingStake = logIsValid ? period.totalInvalidStake : period.totalValidStake;
        
        // Slash losers and calculate total slashed amount
        uint256 totalSlashed = 0;
        uint256[] memory slashedAmounts = new uint256[](losers.length);
        
        for (uint256 i = 0; i < losers.length; i++) {
            address loser = losers[i];
            uint256 stakeAmount = period.attestorStakes[loser];
            uint256 slashAmount = (stakeAmount * SLASH_PERCENTAGE) / 100;
            
            stakingContract.slashTokens(loser, slashAmount);
            stakingContract.unlockTokensFromAttestation(loser, stakeAmount - slashAmount);
            
            slashedAmounts[i] = slashAmount;
            totalSlashed += slashAmount;
        }
        
        // Distribute rewards to winners
        uint256[] memory rewardAmounts = new uint256[](winners.length);
        
        if (winners.length > 0 && totalSlashed > 0) {
            for (uint256 i = 0; i < winners.length; i++) {
                address winner = winners[i];
                uint256 stakeAmount = period.attestorStakes[winner];
                
                // Proportional reward based on stake
                uint256 rewardAmount = (totalSlashed * stakeAmount) / totalWinningStake;
                rewardAmounts[i] = rewardAmount;
                
                // Unlock their original stake
                stakingContract.unlockTokensFromAttestation(winner, stakeAmount);
            }
            
            // Distribute rewards
            stakingContract.distributeAttestationRewards(winners, rewardAmounts);
            emit RewardsDistributed(logId, winners, rewardAmounts);
        } else {
            // If no winners, just unlock everyone's stake
            for (uint256 i = 0; i < winners.length; i++) {
                address winner = winners[i];
                uint256 stakeAmount = period.attestorStakes[winner];
                stakingContract.unlockTokensFromAttestation(winner, stakeAmount);
            }
        }
        
        if (losers.length > 0) {
            emit TokensSlashed(logId, losers, slashedAmounts);
        }
        
        emit AttestationPeriodResolved(logId, logIsValid, period.totalValidStake, period.totalInvalidStake);
    }
    
    /**
     * @notice Get attestation period info
     * @param logId The ID of the hotdog log
     * @return startTime Start time of attestation period
     * @return endTime End time of attestation period
     * @return status Current status
     * @return totalValidStake Total stake on valid side
     * @return totalInvalidStake Total stake on invalid side
     * @return isValid Final result (only valid after resolution)
     */
    function getAttestationPeriod(uint256 logId) external view returns (
        uint256 startTime,
        uint256 endTime,
        AttestationStatus status,
        uint256 totalValidStake,
        uint256 totalInvalidStake,
        bool isValid
    ) {
        AttestationPeriod storage period = attestationPeriods[logId];
        return (
            period.startTime,
            period.endTime,
            period.status,
            period.totalValidStake,
            period.totalInvalidStake,
            period.isValid
        );
    }
    
    /**
     * @notice Check if user has attested to a log
     * @param logId The ID of the hotdog log
     * @param user User address
     * @return Whether user has attested
     */
    function hasUserAttested(uint256 logId, address user) external view returns (bool) {
        return attestationPeriods[logId].hasAttested[user];
    }
    
    /**
     * @notice Get user's stake in an attestation
     * @param logId The ID of the hotdog log
     * @param user User address
     * @return Stake amount
     */
    function getUserStakeInAttestation(uint256 logId, address user) external view returns (uint256) {
        return attestationPeriods[logId].attestorStakes[user];
    }
    
    /**
     * @notice Get all attestors for a log
     * @param logId The ID of the hotdog log
     * @return validAttestors Array of valid attestors
     * @return invalidAttestors Array of invalid attestors
     */
    function getAttestors(uint256 logId) external view returns (address[] memory validAttestors, address[] memory invalidAttestors) {
        AttestationPeriod storage period = attestationPeriods[logId];
        return (period.validAttestors, period.invalidAttestors);
    }
    
    /**
     * @notice Get user's active attestations
     * @param user User address
     * @return Array of log IDs user has attested to
     */
    function getUserAttestations(address user) external view returns (uint256[] memory) {
        return userAttestations[user];
    }
    
    /**
     * @notice Check if attestation period is active
     * @param logId The ID of the hotdog log
     * @return Whether attestation period is active
     */
    function isAttestationPeriodActive(uint256 logId) external view returns (bool) {
        AttestationPeriod storage period = attestationPeriods[logId];
        return period.status == AttestationStatus.Active && block.timestamp <= period.endTime;
    }
    
    /**
     * @notice Add log manager
     * @param manager Address to grant log manager role
     */
    function addLogManager(address manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(LOG_MANAGER_ROLE, manager);
    }
} 
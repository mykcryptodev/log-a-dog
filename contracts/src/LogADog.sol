// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AttestationManager.sol";
import "./CoinDeploymentManager.sol";

/**
 * @title LogADog
 * @dev The worlds first onchain hotdog eating competition
 */
contract LogADog is AccessControl {
    // Role for operators who can act on behalf of users
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Platform referrer address (can be updated by owner)
    address public platformReferrer;
    // Attestation manager contract
    AttestationManager public attestationManager;
    // Coin deployment manager contract
    CoinDeploymentManager public coinDeploymentManager;
    
    struct HotdogLog {
        uint256 logId;
        string imageUri;
        string metadataUri;
        uint256 timestamp;
        address eater;
        address logger;
        address zoraCoin; // Address of the Zora coin created for this log
    }

    struct Attestation {
        address attestor;
        bool isValid;
    }

    HotdogLog[] public hotdogLogs;
    mapping(uint256 => Attestation[]) public attestations;
    mapping(uint256 => mapping(address => bool)) public hasAttested;

    event HotdogLogged(uint256 indexed logId, address indexed logger, address indexed eater, string imageUri, string metadataUri, uint256 timestamp, address zoraCoin);
    event AttestationMade(uint256 indexed logId, address indexed attestor, bool isValid);
    event HotdogLogRevoked(uint256 indexed logId, address indexed logger);
    event AttestationRevoked(uint256 indexed logId, address indexed attestor);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event DogValidityUpdated(uint256 indexed logId, address indexed eater, bool isValid, uint256 timestamp);


    modifier onlyLogOwner(uint256 logId) {
        require(hotdogLogs[logId].eater == msg.sender, "Caller is not the owner of this log");
        _;
    }

    modifier operatorOnly() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Caller is not an operator");
        _;
    }

    constructor(address _platformReferrer, address _attestationManager, address _coinDeploymentManager) {
        platformReferrer = _platformReferrer;
        attestationManager = AttestationManager(_attestationManager);
        coinDeploymentManager = CoinDeploymentManager(_coinDeploymentManager);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, 0x360E36BEFcC2DB9C45e411E5E4840FE33a8f21B0);
    }

    function setPlatformReferrer(address _platformReferrer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        platformReferrer = _platformReferrer;
    }

    function setAttestationManager(address _attestationManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        attestationManager = AttestationManager(_attestationManager);
    }

    function setCoinDeploymentManager(address _coinDeploymentManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        coinDeploymentManager = CoinDeploymentManager(_coinDeploymentManager);
    }

    function addOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(OPERATOR_ROLE, operator);
        emit OperatorAdded(operator);
    }

    function removeOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(OPERATOR_ROLE, operator);
        emit OperatorRemoved(operator);
    }

    /**
     * @notice Logs a hotdog with an image URI, metadata URI, and specified owner.
     */
    function logHotdog(string memory imageUri, string memory metadataUri, string memory coinUri, address eater, bytes calldata poolConfig) external payable returns (uint256 logId) {
        require(eater == msg.sender, "Can only log hotdogs for yourself");
        return _logHotdog(imageUri, metadataUri, coinUri, eater, poolConfig);
    }

    /**
     * @notice Logs a hotdog on behalf of another user (operator only)
     */
    function logHotdogOnBehalf(string memory imageUri, string memory metadataUri, string memory coinUri, address eater, bytes calldata poolConfig) external payable operatorOnly returns (uint256 logId) {
        return _logHotdog(imageUri, metadataUri, coinUri, eater, poolConfig);
    }

    function _logHotdog(string memory imageUri, string memory metadataUri, string memory coinUri, address eater, bytes calldata poolConfig) internal returns (uint256 logId) {
        logId = hotdogLogs.length;
        

        // Deploy coin using CoinDeploymentManager
        address coinAddress;
        if (address(coinDeploymentManager) != address(0)) {
            coinAddress = coinDeploymentManager.deployCoin{value: msg.value}(
                logId,
                eater,
                coinUri,
                poolConfig,
                platformReferrer
            );
        }

        // Log the dog
        hotdogLogs.push(HotdogLog({
            logId: logId,
            imageUri: imageUri,
            metadataUri: metadataUri,
            timestamp: block.timestamp,
            eater: eater,
            logger: msg.sender,
            zoraCoin: coinAddress
        }));

        // Start attestation period if attestation manager is set
        if (address(attestationManager) != address(0)) {
            attestationManager.startAttestationPeriod(logId);
        }

        emit HotdogLogged(logId, msg.sender, eater, imageUri, metadataUri, block.timestamp, coinAddress);
    }

    /**
     * @notice Attests to the validity of a hotdog log using the new staking system
     */
    function attestHotdogLog(uint256 /* logId */, bool /* isValid */, uint256 /* stakeAmount */) external pure {
        revert("Please call attestToLog directly on the AttestationManager contract");
    }

    /**
     * @notice Attests to the validity of a hotdog log on behalf of another user (operator only)
     */
    function attestHotdogLogOnBehalf(uint256 logId, address attestor, bool isValid) external operatorOnly {
        require(hotdogLogs[logId].eater != attestor, "Cannot attest to own log");
        _attestHotdogLog(logId, attestor, isValid);
    }

    /**
     * @notice Resolve an attestation period after it has ended
     */
    function resolveAttestationPeriod(uint256 logId) external {
        require(address(attestationManager) != address(0), "Attestation manager not set");
        attestationManager.resolveAttestationPeriod(logId);
    }

    function _attestHotdogLog(uint256 logId, address attestor, bool isValid) internal {
        bool attestationFound = false;
        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].attestor == attestor) {
                if (attestations[logId][i].isValid != isValid) {
                    attestations[logId][i].isValid = isValid;
                    emit AttestationMade(logId, attestor, isValid);
                }
                attestationFound = true;
                break;
            }
        }

        if (!attestationFound) {
            attestations[logId].push(Attestation({attestor: attestor, isValid: isValid}));
            hasAttested[logId][attestor] = true;
            emit AttestationMade(logId, attestor, isValid);
        }
    }

    /**
     * @notice Revokes a hotdog log.
     */
    function revokeHotdogLog(uint256 logId) external onlyLogOwner(logId) {
        delete hotdogLogs[logId];
        emit HotdogLogRevoked(logId, msg.sender);
    }

    /**
     * @notice Revokes a hotdog log on behalf of another user (operator only)
     */
    function revokeHotdogLogOnBehalf(uint256 logId, address owner) external operatorOnly {
        require(hotdogLogs[logId].eater == owner, "Target is not the owner of this log");
        delete hotdogLogs[logId];
        emit HotdogLogRevoked(logId, owner);
    }

    /**
     * @notice Revokes an attestation to a hotdog log.
     */
    function revokeAttestation(uint256 logId) external {
        require(hasAttested[logId][msg.sender], "Caller has not attested to this log");
        _revokeAttestation(logId, msg.sender);
    }

    /**
     * @notice Revokes an attestation on behalf of another user (operator only)
     */
    function revokeAttestationOnBehalf(uint256 logId, address attestor) external operatorOnly {
        require(hasAttested[logId][attestor], "Target has not attested to this log");
        _revokeAttestation(logId, attestor);
    }

    function _revokeAttestation(uint256 logId, address attestor) internal {
        uint256 index = _findAttestationIndex(logId, attestor);
        _removeAttestation(logId, index);
        hasAttested[logId][attestor] = false;
        emit AttestationRevoked(logId, attestor);
    }

    /**
     * @notice Gets basic info about hotdog logs (simplified version)
     */
    function getHotdogLogsCount() external view returns (uint256) {
        return hotdogLogs.length;
    }

    /**
     * @notice Gets a single hotdog log by ID
     */
    function getHotdogLog(uint256 logId) external view returns (HotdogLog memory log, uint256 validCount, uint256 invalidCount) {
        require(logId < hotdogLogs.length, "Log does not exist");
        log = hotdogLogs[logId];
        (validCount, invalidCount) = _countAttestations(logId);
    }

    /**
     * @notice Gets all hotdog logs logged by a specific user (simplified)
     */
    function getUserHotdogLogCount(address user) external view returns (uint256 count) {
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].eater == user) {
                count++;
            }
        }
    }

    /**
     * @notice Gets a range of hotdog logs (basic pagination)
     */
    function getHotdogLogsRange(uint256 start, uint256 limit) external view returns (HotdogLog[] memory logs) {
        require(start < hotdogLogs.length, "Start index out of bounds");
        
        uint256 end = start + limit;
        if (end > hotdogLogs.length) {
            end = hotdogLogs.length;
        }
        
        logs = new HotdogLog[](end - start);
        for (uint256 i = start; i < end; i++) {
            logs[i - start] = hotdogLogs[i];
        }
    }

    /**
     * @notice Gets paginated hotdog logs submitted between the specified start and end times along with attestation counts and user attestation status.
     * @param startTime The start time for the query.
     * @param endTime The end time for the query.
     * @param user The address of the user to check for attestations.
     * @param start The starting index for pagination.
     * @param limit The maximum number of logs to return.
     * @return logs An array of hotdog logs submitted between the specified times.
     * @return validCounts An array of valid attestation counts corresponding to each log.
     * @return invalidCounts An array of invalid attestation counts corresponding to each log.
     * @return userHasAttested An array indicating whether the user has attested to each log.
     * @return userAttestations An array indicating the value of the user's attestation for each log.
     */
    function getHotdogLogs(uint256 startTime, uint256 endTime, address user, uint256 start, uint256 limit) external view returns (HotdogLog[] memory logs, uint256[] memory validCounts, uint256[] memory invalidCounts, bool[] memory userHasAttested, bool[] memory userAttestations) {
        uint256 totalLogs = 0;
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].timestamp >= startTime && hotdogLogs[i].timestamp <= endTime) {
                totalLogs++;
            }
        }

        uint256 resultCount = totalLogs > start ? totalLogs - start : 0;
        resultCount = resultCount > limit ? limit : resultCount;

        logs = new HotdogLog[](resultCount);
        validCounts = new uint256[](resultCount);
        invalidCounts = new uint256[](resultCount);
        userHasAttested = new bool[](resultCount);
        userAttestations = new bool[](resultCount);

        uint256 index = 0;
        uint256 skipped = 0;
        for (uint256 i = hotdogLogs.length; i > 0 && index < resultCount; i--) {
            if (hotdogLogs[i - 1].timestamp >= startTime && hotdogLogs[i - 1].timestamp <= endTime) {
                if (skipped >= start) {
                    logs[index] = hotdogLogs[i - 1];
                    (validCounts[index], invalidCounts[index]) = _countAttestations(i - 1);
                    userHasAttested[index] = hasAttested[i - 1][user];
                    if (userHasAttested[index]) {
                        userAttestations[index] = _getUserAttestation(i - 1, user);
                    }
                    index++;
                } else {
                    skipped++;
                }
            }
        }
    }

    /**
     * @notice Gets the total number of pages for hotdog logs within the specified time range.
     * @param startTime The start time for the query.
     * @param endTime The end time for the query.
     * @param pageSize The number of logs per page.
     * @return totalPages The total number of pages.
     */
    function getTotalPagesForLogs(uint256 startTime, uint256 endTime, uint256 pageSize) external view returns (uint256 totalPages) {
        uint256 totalLogs = 0;
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].timestamp >= startTime && hotdogLogs[i].timestamp <= endTime) {
                totalLogs++;
            }
        }
        totalPages = (totalLogs + pageSize - 1) / pageSize; // Round up division
    }

    function _getUserAttestation(uint256 logId, address user) internal view returns (bool) {
        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].attestor == user) {
                return attestations[logId][i].isValid;
            }
        }
        revert("User attestation not found");
    }

    function _findAttestationIndex(uint256 logId, address attestor) internal view returns (uint256 index) {
        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].attestor == attestor) {
                return i;
            }
        }
        revert("Attestation not found");
    }

    function _removeAttestation(uint256 logId, uint256 index) internal {
        uint256 lastIndex = attestations[logId].length - 1;
        if (index != lastIndex) {
            attestations[logId][index] = attestations[logId][lastIndex];
        }
        attestations[logId].pop();
    }

    function _isValidLog(uint256 logId) internal view returns (bool) {
        // Check if attestation manager is set and has resolved this log
        if (address(attestationManager) != address(0)) {
            (,, AttestationManager.AttestationStatus status,,, bool isValid,) = attestationManager.getAttestationPeriod(logId);
            if (status == AttestationManager.AttestationStatus.Resolved) {
                return isValid;
            }
        }
        
        // Fallback to old attestation system
        (uint256 validCount, uint256 invalidCount) = _countAttestations(logId);
        return validCount >= invalidCount;
    }

    function _countAttestations(uint256 logId) internal view returns (uint256 validCount, uint256 invalidCount) {
        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].isValid) {
                validCount++;
            } else {
                invalidCount++;
            }
        }
    }

    function getAttestationCount(uint256 logId) external view returns (uint256) {
        return attestations[logId].length;
    }

    /**
     * @notice Gets dogs logged within a time range with their attestation status
     * @param startTime The start time for the query
     * @param endTime The end time for the query
     * @param offset The starting index for pagination
     * @param limit The maximum number of logs to return
     * @return logIds Array of log IDs
     * @return eaters Array of eater addresses
     * @return timestamps Array of log timestamps
     * @return hasAttestationEnded Array indicating if attestation window has ended
     * @return isValid Array indicating if log is valid (only meaningful if attestation ended)
     */
    function getDogsInTimeRange(
        uint256 startTime,
        uint256 endTime,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory logIds,
        address[] memory eaters,
        uint256[] memory timestamps,
        bool[] memory hasAttestationEnded,
        bool[] memory isValid
    ) {
        // Count logs in range
        uint256 totalInRange = 0;
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].timestamp >= startTime && hotdogLogs[i].timestamp <= endTime) {
                totalInRange++;
            }
        }

        // Calculate actual return size
        uint256 returnSize = totalInRange > offset ? totalInRange - offset : 0;
        returnSize = returnSize > limit ? limit : returnSize;

        // Initialize arrays
        logIds = new uint256[](returnSize);
        eaters = new address[](returnSize);
        timestamps = new uint256[](returnSize);
        hasAttestationEnded = new bool[](returnSize);
        isValid = new bool[](returnSize);

        // Populate arrays
        uint256 index = 0;
        uint256 skipped = 0;
        for (uint256 i = 0; i < hotdogLogs.length && index < returnSize; i++) {
            if (hotdogLogs[i].timestamp >= startTime && hotdogLogs[i].timestamp <= endTime) {
                if (skipped >= offset) {
                    logIds[index] = i;
                    eaters[index] = hotdogLogs[i].eater;
                    timestamps[index] = hotdogLogs[i].timestamp;
                    
                    // Check attestation status
                    if (address(attestationManager) != address(0)) {
                        (, uint256 attestationEndTime, AttestationManager.AttestationStatus status,,, bool logIsValid,) = 
                            attestationManager.getAttestationPeriod(i);
                        hasAttestationEnded[index] = (block.timestamp > attestationEndTime) || 
                                                    (status == AttestationManager.AttestationStatus.Resolved);
                        isValid[index] = logIsValid;
                    } else {
                        // Fallback to old system
                        hasAttestationEnded[index] = true;
                        isValid[index] = _isValidLog(i);
                    }
                    
                    index++;
                } else {
                    skipped++;
                }
            }
        }
    }

    /**
     * @notice Emit validity update event for a resolved log (admin only)
     * @param logId The ID of the hotdog log
     */
    function emitValidityUpdate(uint256 logId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(logId < hotdogLogs.length, "Log does not exist");
        bool isValid = _isValidLog(logId);
        emit DogValidityUpdated(logId, hotdogLogs[logId].eater, isValid, block.timestamp);
    }
}

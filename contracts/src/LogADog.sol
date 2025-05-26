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

    event DebugInfo(uint256 msgValue, uint256 contractBalance);

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
        
        emit DebugInfo(msg.value, address(this).balance);

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
            (,, AttestationManager.AttestationStatus status,,, bool isValid) = attestationManager.getAttestationPeriod(logId);
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
}

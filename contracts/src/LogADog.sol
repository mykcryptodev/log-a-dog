// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/Strings.sol";

interface IZoraFactory {
    function deploy(
        address payoutRecipient,
        address[] memory owners,
        string memory uri,
        string memory name,
        string memory symbol,
        address platformReferrer,
        address currency,
        int24 tickLower,
        uint256 orderSize
    ) external payable returns (address, uint256);
}

/**
 * @title LogADog
 * @dev The worlds first onchain hotdog eating competition
 */
contract LogADog {
    // Zora Factory address on Base
    address public constant ZORA_FACTORY = 0x777777751622c0d3258f214F9DF38E35BF45baF3;
    // Platform referrer address (can be updated by owner)
    address public platformReferrer;
    // Temporary flag to disable Zora coins
    bool public zoraEnabled = true;

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

    modifier onlyLogOwner(uint256 logId) {
        require(hotdogLogs[logId].eater == msg.sender, "Caller is not the owner of this log");
        _;
    }

    constructor(address _platformReferrer) {
        platformReferrer = _platformReferrer;
    }

    function setZoraEnabled(bool _zoraEnabled) external {
        zoraEnabled = _zoraEnabled;
    }

    function setPlatformReferrer(address _platformReferrer) external {
        require(msg.sender == platformReferrer, "Only current platform referrer can update");
        platformReferrer = _platformReferrer;
    }

    /**
     * @notice Logs a hotdog with an image URI, metadata URI, and specified owner.
     * @param imageUri The URI pointing to the image of the hotdog being eaten.
     * @param metadataUri The URI pointing to the metadata JSON object.
     * @param eater The address of the hotdog eater.
     * @return logId The ID of the newly created hotdog log.
     * @dev Any eth sent with the transaction is used to purchase the zora coin.
     */
    function logHotdog(string memory imageUri, string memory metadataUri, address eater) external payable returns (uint256 logId) {
        logId = hotdogLogs.length;
        
        // Create Zora coin first
        address[] memory owners = new address[](1);
        owners[0] = eater;

        (address coinAddress,) = IZoraFactory(ZORA_FACTORY).deploy{value: msg.value}(
            eater, // payout recipient
            owners, // owners
            metadataUri, // uri
            string.concat("Logged Dog #", Strings.toString(logId)), // name
            "LOGADOG", // symbol
            platformReferrer, // platform referrer
            address(0), // currency (ETH/WETH)
            -208200, // tickLower (required for ETH/WETH pairs)
            msg.value // order size
        );

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

        emit HotdogLogged(logId, msg.sender, eater, imageUri, metadataUri, block.timestamp, coinAddress);
    }

    /**
     * @notice Attests to the validity of a hotdog log or updates the attestation if it already exists.
     * @param logId The ID of the hotdog log to attest to.
     * @param isValid True if the log is valid, false if invalid.
     */
    function attestHotdogLog(uint256 logId, bool isValid) external {
        require(hotdogLogs[logId].eater != msg.sender, "Caller cannot attest to their own log");

        bool attestationFound = false;
        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].attestor == msg.sender) {
                if (attestations[logId][i].isValid != isValid) {
                    attestations[logId][i].isValid = isValid;
                    emit AttestationMade(logId, msg.sender, isValid);
                }
                attestationFound = true;
                break;
            }
        }

        if (!attestationFound) {
            attestations[logId].push(Attestation({attestor: msg.sender, isValid: isValid}));
            hasAttested[logId][msg.sender] = true;
            emit AttestationMade(logId, msg.sender, isValid);
        }
    }

    /**
     * @notice Revokes a hotdog log.
     * @param logId The ID of the hotdog log to revoke.
     */
    function revokeHotdogLog(uint256 logId) external onlyLogOwner(logId) {
        delete hotdogLogs[logId];
        emit HotdogLogRevoked(logId, msg.sender);
    }

    /**
     * @notice Revokes an attestation to a hotdog log.
     * @param logId The ID of the hotdog log for which to revoke the attestation.
     */
    function revokeAttestation(uint256 logId) external {
        require(hasAttested[logId][msg.sender], "Caller has not attested to this log");
        uint256 index = _findAttestationIndex(logId, msg.sender);
        _removeAttestation(logId, index);
        hasAttested[logId][msg.sender] = false;
        emit AttestationRevoked(logId, msg.sender);
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

    /**
     * @notice Gets leaderboard of users with the most valid hotdog logs submitted between the specified start and end times, sorted by valid log count.
     * @param startTime The start time for the query.
     * @param endTime The end time for the query.
     * @return users An array of addresses of the users.
     * @return validLogCounts An array of valid log counts corresponding to each user.
     */
    function getLeaderboard(uint256 startTime, uint256 endTime) external view returns (address[] memory users, uint256[] memory validLogCounts) {
        address[] memory tempUsers = new address[](hotdogLogs.length);
        uint256[] memory tempCounts = new uint256[](hotdogLogs.length);
        uint256 userCount = 0;

        // Iterate through logs to count valid logs per user
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            HotdogLog storage log = hotdogLogs[i];
            if (log.timestamp >= startTime && log.timestamp <= endTime && _isValidLog(i)) {
                bool userExists = false;
                for (uint256 j = 0; j < userCount; j++) {
                    if (tempUsers[j] == log.eater) {
                        tempCounts[j]++;
                        userExists = true;
                        break;
                    }
                }
                if (!userExists) {
                    tempUsers[userCount] = log.eater;
                    tempCounts[userCount] = 1;
                    userCount++;
                }
            }
        }

        // Prepare result arrays
        users = new address[](userCount);
        validLogCounts = new uint256[](userCount);
        for (uint256 i = 0; i < userCount; i++) {
            users[i] = tempUsers[i];
            validLogCounts[i] = tempCounts[i];
        }

        // Sort the users and their valid log counts using bubble sort
        for (uint256 i = 0; i < userCount - 1; i++) {
            for (uint256 j = 0; j < userCount - i - 1; j++) {
                if (validLogCounts[j] < validLogCounts[j + 1]) {
                    // Swap validLogCounts
                    uint256 tempCount = validLogCounts[j];
                    validLogCounts[j] = validLogCounts[j + 1];
                    validLogCounts[j + 1] = tempCount;

                    // Swap users
                    address tempUser = users[j];
                    users[j] = users[j + 1];
                    users[j + 1] = tempUser;
                }
            }
        }
    }

    /**
     * @notice Gets all hotdog logs logged by a specific user along with attestation counts.
     * @param user The address of the user.
     * @return logs An array of hotdog logs with attestation counts.
     * @return validCounts An array of valid attestation counts corresponding to each log.
     * @return invalidCounts An array of invalid attestation counts corresponding to each log.
     */
    function getUserHotdogLogs(address user) external view returns (HotdogLog[] memory logs, uint256[] memory validCounts, uint256[] memory invalidCounts) {
        uint256 count = 0;
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].eater == user) {
                count++;
            }
        }

        logs = new HotdogLog[](count);
        validCounts = new uint256[](count);
        invalidCounts = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].eater == user) {
                logs[index] = hotdogLogs[i];
                (validCounts[index], invalidCounts[index]) = _countAttestations(i);
                index++;
            }
        }
    }

    /**
     * @notice Gets the total number of hotdog logs for a specific user.
     * @param user The address of the user.
     * @return count The total number of hotdog logs for the user.
     */
    function getUserHotdogLogCount(address user) external view returns (uint256 count) {
        return _countUserHotdogLogs(user);
    }

    /**
     * @notice Gets the total number of hotdog logs for multiple users.
     * @param users An array of addresses to get counts for.
     * @return counts An array of hotdog log counts corresponding to each user.
     */
    function getBulkUserHotdogLogCount(address[] calldata users) external view returns (uint256[] memory counts) {
        counts = new uint256[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            counts[i] = _countUserHotdogLogs(users[i]);
        }
    }

    /**
     * @notice Internal function to count the number of hotdog logs for a user.
     * @param user The address of the user.
     * @return count The total number of hotdog logs for the user.
     */
    function _countUserHotdogLogs(address user) internal view returns (uint256 count) {
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].eater == user) {
                count++;
            }
        }
    }

    /**
     * @notice Gets the total number of pages for a user's hotdog logs.
     * @param user The address of the user.
     * @param pageSize The number of logs per page.
     * @return totalPages The total number of pages.
     */
    function getTotalPages(address user, uint256 pageSize) external view returns (uint256 totalPages) {
        uint256 userLogCount = _countUserHotdogLogs(user);
        totalPages = (userLogCount + pageSize - 1) / pageSize; // Round up division
    }

    /**
     * @notice Gets paginated hotdog logs for a specific user.
     * @param user The address of the user.
     * @param start The starting index for pagination.
     * @param limit The maximum number of logs to return.
     * @return logs An array of hotdog logs with attestation counts.
     * @return validCounts An array of valid attestation counts corresponding to each log.
     * @return invalidCounts An array of invalid attestation counts corresponding to each log.
     */
    function getUserHotdogLogsPaginated(address user, uint256 start, uint256 limit) external view returns (HotdogLog[] memory logs, uint256[] memory validCounts, uint256[] memory invalidCounts) {
        uint256 totalLogs = 0;
        for (uint256 i = 0; i < hotdogLogs.length; i++) {
            if (hotdogLogs[i].eater == user) {
                totalLogs++;
            }
        }

        uint256 resultCount = totalLogs > start ? totalLogs - start : 0;
        resultCount = resultCount > limit ? limit : resultCount;

        logs = new HotdogLog[](resultCount);
        validCounts = new uint256[](resultCount);
        invalidCounts = new uint256[](resultCount);

        uint256 index = 0;
        uint256 skipped = 0;
        for (uint256 i = 0; i < hotdogLogs.length && index < resultCount; i++) {
            if (hotdogLogs[i].eater == user) {
                if (skipped >= start) {
                    logs[index] = hotdogLogs[i];
                    (validCounts[index], invalidCounts[index]) = _countAttestations(i);
                    index++;
                } else {
                    skipped++;
                }
            }
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
        uint256 validCount = 0;
        uint256 invalidCount = 0;

        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].isValid) {
                validCount++;
            } else {
                invalidCount++;
            }
        }

        return validCount >= invalidCount;
    }

    function _countAttestations(uint256 logId) internal view returns (uint256 validCount, uint256 invalidCount) {
        validCount = 0;
        invalidCount = 0;

        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].isValid) {
                validCount++;
            } else {
                invalidCount++;
            }
        }
    }

    function _getUserAttestation(uint256 logId, address user) internal view returns (bool) {
        for (uint256 i = 0; i < attestations[logId].length; i++) {
            if (attestations[logId][i].attestor == user) {
                return attestations[logId][i].isValid;
            }
        }
        revert("User attestation not found");
    }

    function getAttestationCount(uint256 logId) external view returns (uint256) {
        return attestations[logId].length;
    }
}

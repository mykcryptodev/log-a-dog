// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/LogADog.sol";

contract LogADogTest is Test {
    LogADog public logADog;
    address public constant ZORA_FACTORY = 0x777777751622c0d3258f214F9DF38E35BF45baF3;
    address public constant MOCK_COIN_ADDRESS = address(0x1234);
    
    address public user1;
    address public user2;
    address public operator;
    address public platformReferrer;
    address public admin;

    function setUp() public {
        user1 = address(0x1);
        user2 = address(0x2);
        operator = address(0x3);
        platformReferrer = address(0x4);
        admin = address(this);
        
        // Deploy LogADog contract
        logADog = new LogADog(platformReferrer);
        
        // Enable Zora coins
        logADog.setZoraEnabled(true);
        
        // Add operator
        logADog.addOperator(operator);
        
        // Mock Zora factory calls
        vm.mockCall(
            ZORA_FACTORY,
            abi.encodeWithSelector(
                IZoraFactory.deploy.selector,
                user2, // payout recipient
                new address[](1), // owners
                "metadataUri", // uri
                "Logged Dog #0", // name
                "LOGADOG", // symbol
                bytes("0x0"), // poolConfig
                platformReferrer, // platform referrer
                address(0), // currency
                1 ether // order size
            ),
            abi.encode(MOCK_COIN_ADDRESS, 1)
        );
    }

    function testConstructor() public view {
        assertEq(logADog.platformReferrer(), platformReferrer);
        assertTrue(logADog.hasRole(logADog.DEFAULT_ADMIN_ROLE(), admin));
    }

    function testSetPlatformReferrer() public {
        logADog.setPlatformReferrer(user1);
        assertEq(logADog.platformReferrer(), user1);
    }

    function test_RevertWhen_NotAdminSetsPlatformReferrer() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                user1,
                logADog.DEFAULT_ADMIN_ROLE()
            )
        );
        logADog.setPlatformReferrer(user1);
        vm.stopPrank();
    }

    function testAddAndRemoveOperator() public {
        // Test adding operator
        logADog.addOperator(user1);
        assertTrue(logADog.hasRole(logADog.OPERATOR_ROLE(), user1));

        // Test removing operator
        logADog.removeOperator(user1);
        assertFalse(logADog.hasRole(logADog.OPERATOR_ROLE(), user1));
    }

    function test_RevertWhen_NotAdminAddsOperator() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                user1,
                logADog.DEFAULT_ADMIN_ROLE()
            )
        );
        logADog.addOperator(user2);
        vm.stopPrank();
    }

    function testLogHotdog() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1, // Can only log for self
            bytes("0x0")
        );
        
        // Verify log was created
        (uint256 id, string memory imageUri, string memory metadataUri, uint256 timestamp, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
        assertEq(eater, user1);
        assertEq(logger, user1);
        assertEq(imageUri, "imageUri");
        assertEq(metadataUri, "metadataUri");
        assertEq(zoraCoin, MOCK_COIN_ADDRESS);
    }

    function test_RevertWhen_LoggingForOthers() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        vm.expectRevert("Can only log hotdogs for yourself");
        logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user2, // Trying to log for someone else
            bytes("0x0")
        );
    }

    function testLogHotdogOnBehalf() public {
        vm.deal(operator, 1 ether);
        vm.startPrank(operator);
        
        uint256 logId = logADog.logHotdogOnBehalf{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user2,
            bytes("0x0")
        );
        
        // Verify log was created
        (uint256 id, string memory imageUri, string memory metadataUri, uint256 timestamp, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
        assertEq(eater, user2);
        assertEq(logger, operator);
        assertEq(imageUri, "imageUri");
        assertEq(metadataUri, "metadataUri");
        assertEq(zoraCoin, MOCK_COIN_ADDRESS);
    }

    function test_RevertWhen_NonOperatorLogsOnBehalf() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        vm.expectRevert("Caller is not an operator");
        logADog.logHotdogOnBehalf{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user2,
            bytes("0x0")
        );
    }

    function testAttestHotdogLog() public {
        // First log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            bytes("0x0")
        );
        
        // Then attest to it as user2
        vm.startPrank(user2);
        logADog.attestHotdogLog(logId, true);
        
        // Verify attestation
        (uint256 validCount, uint256 invalidCount) = _countAttestations(logId);
        assertEq(validCount, 1);
        assertEq(invalidCount, 0);
    }

    function testAttestHotdogLogOnBehalf() public {
        // First log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            bytes("0x0")
        );
        
        // Then attest to it as operator on behalf of user2
        vm.startPrank(operator);
        logADog.attestHotdogLogOnBehalf(logId, user2, true);
        
        // Verify attestation
        (uint256 validCount, uint256 invalidCount) = _countAttestations(logId);
        assertEq(validCount, 1);
        assertEq(invalidCount, 0);
    }

    function test_RevertWhen_NonOperatorAttestsOnBehalf() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            bytes("0x0")
        );
        
        vm.startPrank(user2);
        vm.expectRevert("Caller is not an operator");
        logADog.attestHotdogLogOnBehalf(logId, user2, true);
    }

    function testRevokeHotdogLog() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            bytes("0x0")
        );
        
        logADog.revokeHotdogLog(logId);
        
        // Verify log was deleted
        (uint256 id, string memory imageUri, string memory metadataUri, uint256 timestamp, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
        assertEq(eater, address(0));
    }

    function testRevokeHotdogLogOnBehalf() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            bytes("0x0")
        );
        
        vm.startPrank(operator);
        logADog.revokeHotdogLogOnBehalf(logId, user1);
        
        // Verify log was deleted
        (uint256 id, string memory imageUri, string memory metadataUri, uint256 timestamp, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
        assertEq(eater, address(0));
    }

    function test_RevertWhen_NonOperatorRevokesOnBehalf() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            bytes("0x0")
        );
        
        vm.startPrank(user2);
        vm.expectRevert("Caller is not an operator");
        logADog.revokeHotdogLogOnBehalf(logId, user1);
    }

    function testGetLeaderboard() public {
        // Log multiple hotdogs
        vm.deal(user1, 2 ether);
        vm.startPrank(user1);
        
        // First hotdog
        logADog.logHotdog{value: 1 ether}(
            "imageUri1",
            "metadataUri1",
            user2,
            bytes("0x0")
        );
        
        // Second hotdog
        logADog.logHotdog{value: 1 ether}(
            "imageUri2",
            "metadataUri2",
            user2,
            bytes("0x0")
        );
        
        // Attest to both hotdogs
        logADog.attestHotdogLog(0, true);
        logADog.attestHotdogLog(1, true);
        
        // Get leaderboard
        (address[] memory users, uint256[] memory validLogCounts) = logADog.getLeaderboard(0, block.timestamp);
        
        assertEq(users.length, 1);
        assertEq(users[0], user2);
        assertEq(validLogCounts[0], 2);
    }

    function testGetUserHotdogLogs() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user2,
            bytes("0x0")
        );
        
        // Attest to the log
        logADog.attestHotdogLog(logId, true);
        
        // Get user logs
        (
            LogADog.HotdogLog[] memory logs,
            uint256[] memory validCounts,
            uint256[] memory invalidCounts,
            bool[] memory userHasAttested,
            bool[] memory userAttestations
        ) = logADog.getHotdogLogs(0, block.timestamp, user1, 0, 10);
        
        assertEq(logs.length, 1);
        assertEq(logs[0].eater, user2);
        assertEq(validCounts[0], 1);
        assertEq(invalidCounts[0], 0);
        assertEq(userHasAttested[0], true);
        assertEq(userAttestations[0], true);
    }

    function testGetTotalPages() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user2,
            bytes("0x0")
        );
        
        uint256 totalPages = logADog.getTotalPagesForLogs(0, block.timestamp, 10);
        assertEq(totalPages, 1);
    }

    // Helper function to count attestations
    function _countAttestations(uint256 logId) internal view returns (uint256 validCount, uint256 invalidCount) {
        uint256 attestationCount = logADog.getAttestationCount(logId);
        
        // Count valid and invalid attestations
        for (uint256 i = 0; i < attestationCount; i++) {
            (address attestor, bool isValid) = logADog.attestations(logId, i);
            if (isValid) {
                validCount++;
            } else {
                invalidCount++;
            }
        }
    }
}

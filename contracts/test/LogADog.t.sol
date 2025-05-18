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
    address public platformReferrer;

    function setUp() public {
        user1 = address(0x1);
        user2 = address(0x2);
        platformReferrer = address(0x3);
        
        // Deploy LogADog contract
        logADog = new LogADog(platformReferrer);
        
        // Enable Zora coins
        logADog.setZoraEnabled(true);
        
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
                logADog.POOL_CONFIG(), // poolConfig
                platformReferrer, // platform referrer
                address(0), // currency
                1 ether // order size
            ),
            abi.encode(MOCK_COIN_ADDRESS, 1)
        );
    }

    function testConstructor() public view {
        assertEq(logADog.platformReferrer(), platformReferrer);
    }

    function testSetPlatformReferrer() public {
        vm.startPrank(platformReferrer);
        logADog.setPlatformReferrer(user1);
        assertEq(logADog.platformReferrer(), user1);
        vm.stopPrank();
    }

    function test_RevertWhen_NotOwnerSetsPlatformReferrer() public {
        vm.startPrank(user1);
        vm.expectRevert("Only current platform referrer can update");
        logADog.setPlatformReferrer(user1);
        vm.stopPrank();
    }

    function testLogHotdog() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        // Expect the Zora factory call
        vm.expectCall(
            ZORA_FACTORY,
            abi.encodeWithSelector(
                IZoraFactory.deploy.selector,
                user2, // payout recipient
                new address[](1), // owners
                "metadataUri", // uri
                "Logged Dog #0", // name
                "LOGADOG", // symbol
                logADog.POOL_CONFIG(), // poolConfig
                platformReferrer, // platform referrer
                address(0), // currency
                1 ether // order size
            )
        );
        
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user2,
            logADog.POOL_CONFIG()
        );
        
        // Verify log was created
        (uint256 id, string memory imageUri, string memory metadataUri, uint256 timestamp, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
        assertEq(eater, user2);
        assertEq(logger, user1);
        assertEq(imageUri, "imageUri");
        assertEq(metadataUri, "metadataUri");
        assertEq(zoraCoin, MOCK_COIN_ADDRESS);
    }

    function testAttestHotdogLog() public {
        // First log a hotdog
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user2,
            logADog.POOL_CONFIG()
        );
        
        // Then attest to it
        vm.startPrank(user1);
        logADog.attestHotdogLog(logId, true);
        
        // Verify attestation
        (uint256 validCount, uint256 invalidCount) = _countAttestations(logId);
        assertEq(validCount, 1);
        assertEq(invalidCount, 0);
    }

    function test_RevertWhen_OwnerAttestsOwnLog() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            logADog.POOL_CONFIG()
        );
        
        vm.expectRevert("Caller cannot attest to their own log");
        logADog.attestHotdogLog(logId, true);
    }

    function testRevokeHotdogLog() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            user1,
            logADog.POOL_CONFIG()
        );
        
        logADog.revokeHotdogLog(logId);
        
        // Verify log was deleted
        (uint256 id, string memory imageUri, string memory metadataUri, uint256 timestamp, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
        assertEq(eater, address(0));
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
            logADog.POOL_CONFIG()
        );
        
        // Second hotdog
        logADog.logHotdog{value: 1 ether}(
            "imageUri2",
            "metadataUri2",
            user2,
            logADog.POOL_CONFIG()
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
            logADog.POOL_CONFIG()
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
            logADog.POOL_CONFIG()
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

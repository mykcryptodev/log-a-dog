// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/LogADog.sol";
import "../src/CoinDeploymentManager.sol";

contract LogADogTest is Test {
    LogADog public logADog;
    CoinDeploymentManager public coinDeploymentManager;
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
        
        // Deploy CoinDeploymentManager first
        coinDeploymentManager = new CoinDeploymentManager(ZORA_FACTORY, "LOGADOG");
        
        // Deploy LogADog contract (without attestation manager for backward compatibility)
        logADog = new LogADog(platformReferrer, address(0), address(coinDeploymentManager));
        
        // Grant deployer role to LogADog contract
        coinDeploymentManager.addDeployer(address(logADog));
        
        // Add operator
        logADog.addOperator(operator);
        
        // Mock Zora factory calls - use a more flexible mock that matches any call
        vm.mockCall(
            ZORA_FACTORY,
            abi.encodeWithSelector(IZoraFactory.deploy.selector),
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
            "coinUri",
            user1, // Can only log for self
            bytes("0x0")
        );
        
        // Verify log was created
        (, string memory imageUri, string memory metadataUri,, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
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
            "coinUri",
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
            "coinUri",
            user2,
            bytes("0x0")
        );
        
        // Verify log was created
        (, string memory imageUri, string memory metadataUri,, address eater, address logger, address zoraCoin) = logADog.hotdogLogs(logId);
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
            "coinUri",
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
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank(); // Stop pranking as user1
        
        // Then attest to it as operator on behalf of user2 (using old attestation system)
        vm.startPrank(operator);
        logADog.attestHotdogLogOnBehalf(logId, user2, true);
        vm.stopPrank(); // Stop pranking as operator
        
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
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank(); // Stop pranking as user1
        
        // Then attest to it as operator on behalf of user2
        vm.startPrank(operator);
        logADog.attestHotdogLogOnBehalf(logId, user2, true);
        vm.stopPrank(); // Stop pranking as operator
        
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
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank(); // Stop pranking as user1
        
        vm.startPrank(user2);
        vm.expectRevert("Caller is not an operator");
        logADog.attestHotdogLogOnBehalf(logId, user2, true);
        vm.stopPrank(); // Stop pranking as user2
    }

    function testRevokeHotdogLog() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        
        logADog.revokeHotdogLog(logId);
        
        // Verify log was deleted
        (,,,, address eater,,) = logADog.hotdogLogs(logId);
        assertEq(eater, address(0));
        vm.stopPrank(); // Stop pranking as user1
    }

    function testRevokeHotdogLogOnBehalf() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank(); // Stop pranking as user1
        
        vm.startPrank(operator);
        logADog.revokeHotdogLogOnBehalf(logId, user1);
        
        // Verify log was deleted
        (,,,, address eater,,) = logADog.hotdogLogs(logId);
        assertEq(eater, address(0));
        vm.stopPrank(); // Stop pranking as operator
    }

    function test_RevertWhen_NonOperatorRevokesOnBehalf() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank(); // Stop pranking as user1
        
        vm.startPrank(user2);
        vm.expectRevert("Caller is not an operator");
        logADog.revokeHotdogLogOnBehalf(logId, user1);
        vm.stopPrank(); // Stop pranking as user2
    }

    function testGetHotdogLogsCount() public {
        // Initially should be 0
        assertEq(logADog.getHotdogLogsCount(), 0);
        
        // Log multiple hotdogs
        vm.deal(user1, 2 ether);
        vm.startPrank(user1);
        
        // First hotdog
        logADog.logHotdog{value: 1 ether}(
            "imageUri1",
            "metadataUri1",
            "coinUri1",
            user1,
            bytes("0x0")
        );
        
        // Second hotdog
        logADog.logHotdog{value: 1 ether}(
            "imageUri2",
            "metadataUri2",
            "coinUri2",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // Should now be 2
        assertEq(logADog.getHotdogLogsCount(), 2);
    }

    function testGetHotdogLog() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        uint256 logId = logADog.logHotdog{value: 1 ether}(
            "imageUri",
            "metadataUri",
            "coinUri",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // Attest to the log as operator on behalf of user2
        vm.startPrank(operator);
        logADog.attestHotdogLogOnBehalf(logId, user2, true);
        vm.stopPrank();
        
        // Get individual log
        (
            LogADog.HotdogLog memory log,
            uint256 validCount,
            uint256 invalidCount
        ) = logADog.getHotdogLog(logId);
        
        assertEq(log.eater, user1);
        assertEq(log.imageUri, "imageUri");
        assertEq(log.metadataUri, "metadataUri");
        assertEq(validCount, 1);
        assertEq(invalidCount, 0);
    }

    function testGetHotdogLogsRange() public {
        vm.deal(user1, 2 ether);
        vm.startPrank(user1);
        
        // Log two hotdogs
        logADog.logHotdog{value: 1 ether}(
            "imageUri1",
            "metadataUri1",
            "coinUri1",
            user1,
            bytes("0x0")
        );
        
        logADog.logHotdog{value: 1 ether}(
            "imageUri2",
            "metadataUri2",
            "coinUri2",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // Get range of logs
        LogADog.HotdogLog[] memory logs = logADog.getHotdogLogsRange(0, 2);
        
        assertEq(logs.length, 2);
        assertEq(logs[0].imageUri, "imageUri1");
        assertEq(logs[1].imageUri, "imageUri2");
        assertEq(logs[0].eater, user1);
        assertEq(logs[1].eater, user1);
    }

    function testGetUserHotdogLogCount() public {
        // Initially should be 0 for both users
        assertEq(logADog.getUserHotdogLogCount(user1), 0);
        assertEq(logADog.getUserHotdogLogCount(user2), 0);
        
        vm.deal(user1, 2 ether);
        vm.startPrank(user1);
        
        // Log two hotdogs for user1
        logADog.logHotdog{value: 1 ether}(
            "imageUri1",
            "metadataUri1",
            "coinUri1",
            user1,
            bytes("0x0")
        );
        
        logADog.logHotdog{value: 1 ether}(
            "imageUri2",
            "metadataUri2",
            "coinUri2",
            user1,
            bytes("0x0")
        );
        vm.stopPrank();
        
        // Check counts
        assertEq(logADog.getUserHotdogLogCount(user1), 2);
        assertEq(logADog.getUserHotdogLogCount(user2), 0);
    }

    // Helper function to count attestations
    function _countAttestations(uint256 logId) internal view returns (uint256 validCount, uint256 invalidCount) {
        uint256 attestationCount = logADog.getAttestationCount(logId);
        
        // Count valid and invalid attestations
        for (uint256 i = 0; i < attestationCount; i++) {
            (, bool isValid) = logADog.attestations(logId, i);
            if (isValid) {
                validCount++;
            } else {
                invalidCount++;
            }
        }
    }
}

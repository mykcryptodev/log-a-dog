// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/CoinDeploymentManager.sol";

contract CoinDeploymentManagerTest is Test {
    CoinDeploymentManager public coinManager;
    address public constant ZORA_FACTORY = 0x777777751622c0d3258f214F9DF38E35BF45baF3;
    address public constant MOCK_COIN_ADDRESS = address(0x1234);
    
    address public admin;
    address public deployer;
    address public user1;

    function setUp() public {
        admin = address(this);
        deployer = address(0x1);
        user1 = address(0x2);
        
        // Deploy CoinDeploymentManager
        coinManager = new CoinDeploymentManager(ZORA_FACTORY, "LOGADOG");
        
        // Mock Zora factory calls
        vm.mockCall(
            ZORA_FACTORY,
            abi.encodeWithSelector(IZoraFactory.deploy.selector),
            abi.encode(MOCK_COIN_ADDRESS, bytes(""))
        );
    }

    function testConstructor() public view {
        (address factory, string memory symbol) = coinManager.getDeploymentInfo();
        assertEq(factory, ZORA_FACTORY);
        assertEq(symbol, "LOGADOG");
        assertTrue(coinManager.hasRole(coinManager.DEFAULT_ADMIN_ROLE(), admin));
    }

    function testAddAndRemoveDeployer() public {
        // Add deployer
        coinManager.addDeployer(deployer);
        assertTrue(coinManager.hasRole(coinManager.DEPLOYER_ROLE(), deployer));

        // Remove deployer
        coinManager.removeDeployer(deployer);
        assertFalse(coinManager.hasRole(coinManager.DEPLOYER_ROLE(), deployer));
    }

    function test_RevertWhen_NonAdminAddsDeployer() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                user1,
                coinManager.DEFAULT_ADMIN_ROLE()
            )
        );
        coinManager.addDeployer(deployer);
        vm.stopPrank();
    }

    function testDeployCoin() public {
        // Add deployer role
        coinManager.addDeployer(deployer);
        
        vm.deal(deployer, 1 ether);
        vm.startPrank(deployer);
        
        address coinAddress = coinManager.deployCoin{value: 1 ether}(
            0, // logId
            user1, // eater
            "metadataUri",
            bytes("0x0"), // poolConfig
            address(0x4) // platformReferrer
        );
        
        assertEq(coinAddress, MOCK_COIN_ADDRESS);
        vm.stopPrank();
    }

    function test_RevertWhen_NonDeployerDeploysCoin() public {
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                user1,
                coinManager.DEPLOYER_ROLE()
            )
        );
        coinManager.deployCoin{value: 1 ether}(
            0,
            user1,
            "metadataUri",
            bytes("0x0"),
            address(0x4)
        );
        vm.stopPrank();
    }

    function testUpdateCoinFactory() public {
        address newFactory = address(0x5678);
        
        vm.expectEmit(true, true, false, true);
        emit CoinDeploymentManager.FactoryUpdated(ZORA_FACTORY, newFactory);
        
        coinManager.updateCoinFactory(newFactory);
        
        (address factory,) = coinManager.getDeploymentInfo();
        assertEq(factory, newFactory);
    }

    function testUpdateCoinSymbol() public {
        string memory newSymbol = "NEWDOG";
        
        vm.expectEmit(false, false, false, true);
        emit CoinDeploymentManager.SymbolUpdated("LOGADOG", newSymbol);
        
        coinManager.updateCoinSymbol(newSymbol);
        
        (, string memory symbol) = coinManager.getDeploymentInfo();
        assertEq(symbol, newSymbol);
    }

    function test_RevertWhen_NonAdminUpdatesFactory() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                user1,
                coinManager.DEFAULT_ADMIN_ROLE()
            )
        );
        coinManager.updateCoinFactory(address(0x5678));
        vm.stopPrank();
    }

    function test_RevertWhen_NonAdminUpdatesSymbol() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                user1,
                coinManager.DEFAULT_ADMIN_ROLE()
            )
        );
        coinManager.updateCoinSymbol("NEWDOG");
        vm.stopPrank();
    }

    function test_RevertWhen_FactoryNotSet() public {
        // Create a new manager with no factory
        CoinDeploymentManager emptyManager = new CoinDeploymentManager(address(0), "TEST");
        emptyManager.addDeployer(deployer);
        
        vm.deal(deployer, 1 ether);
        vm.startPrank(deployer);
        
        vm.expectRevert("Coin factory not set");
        emptyManager.deployCoin{value: 1 ether}(
            0,
            user1,
            "metadataUri",
            bytes("0x0"),
            address(0x4)
        );
        vm.stopPrank();
    }
} 
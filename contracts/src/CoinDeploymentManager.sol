// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IZoraFactory {
    function deploy(
        address payoutRecipient,
        address[] memory owners,
        string memory uri,
        string memory name,
        string memory symbol,
        bytes calldata poolConfig,
        address platformReferrer,
        uint256 orderSize
    ) external payable returns (address, uint256);
}

/**
 * @title CoinDeploymentManager
 * @dev Manages coin deployment for hotdog logs - swappable implementation
 */
contract CoinDeploymentManager is AccessControl {
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    // Current coin deployment strategy
    address public coinFactory;
    string public coinSymbol;
    
    event CoinDeployed(uint256 indexed logId, address indexed coinAddress, address indexed eater);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);
    event SymbolUpdated(string oldSymbol, string newSymbol);
    
    constructor(address _coinFactory, string memory _coinSymbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        coinFactory = _coinFactory;
        coinSymbol = _coinSymbol;
    }
    
    /**
     * @notice Deploy a coin for a hotdog log
     * @param logId The ID of the hotdog log
     * @param eater The address of the hotdog eater
     * @param metadataUri The metadata URI for the coin
     * @param poolConfig The pool configuration
     * @param platformReferrer The platform referrer address
     * @return coinAddress The address of the deployed coin
     */
    function deployCoin(
        uint256 logId,
        address eater,
        string memory metadataUri,
        bytes calldata poolConfig,
        address platformReferrer
    ) external payable onlyRole(DEPLOYER_ROLE) returns (address coinAddress) {
        require(coinFactory != address(0), "Coin factory not set");
        
        // Create owners array
        address[] memory owners = new address[](1);
        owners[0] = eater;
        
        // Generate coin name
        string memory coinName = string.concat("Logged Dog #", Strings.toString(logId));
        
        // Deploy coin using current strategy
        (coinAddress,) = IZoraFactory(coinFactory).deploy{value: msg.value}(
            eater, // payout recipient
            owners, // owners
            metadataUri, // uri
            coinName, // name
            coinSymbol, // symbol
            poolConfig, // configuration for the pool
            platformReferrer, // platform referrer
            msg.value // order size
        );
        
        emit CoinDeployed(logId, coinAddress, eater);
    }
    
    /**
     * @notice Update the coin factory (admin only)
     * @param _newFactory The new factory address
     */
    function updateCoinFactory(address _newFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldFactory = coinFactory;
        coinFactory = _newFactory;
        emit FactoryUpdated(oldFactory, _newFactory);
    }
    
    /**
     * @notice Update the coin symbol (admin only)
     * @param _newSymbol The new coin symbol
     */
    function updateCoinSymbol(string memory _newSymbol) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldSymbol = coinSymbol;
        coinSymbol = _newSymbol;
        emit SymbolUpdated(oldSymbol, _newSymbol);
    }
    
    /**
     * @notice Add a deployer role (admin only)
     * @param deployer The address to grant deployer role
     */
    function addDeployer(address deployer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DEPLOYER_ROLE, deployer);
    }
    
    /**
     * @notice Remove a deployer role (admin only)
     * @param deployer The address to revoke deployer role
     */
    function removeDeployer(address deployer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(DEPLOYER_ROLE, deployer);
    }
    
    /**
     * @notice Get current factory and symbol info
     */
    function getDeploymentInfo() external view returns (address factory, string memory symbol) {
        return (coinFactory, coinSymbol);
    }
} 
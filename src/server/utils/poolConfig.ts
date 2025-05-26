import { encodeAbiParameters } from "viem";

// Pool configuration types and constants
const POOL_CONFIG_VERSION = 4; // Uniswap v4
const WETH_BASE = "0x4200000000000000000000000000000000000006";
const TICK_SPACING = 60; // 0.3% fee tier
const TICK_RANGE = 10; // ±10 tick steps
const NUM_DISCOVERY_POSITIONS = 10;
const MAX_DISCOVERY_SUPPLY_SHARE = BigInt("50000000000000000"); // 5% in wei (0.05 * 1e18)

/**
 * Encodes pool configuration parameters for Zora Coin deployment
 * @returns ABI-encoded pool configuration bytes
 */
export function encodePoolConfig() {
  return encodeAbiParameters(
    [
      { name: "version", type: "uint8" },
      { name: "currency", type: "address" },
      { name: "tickLower", type: "int256[]" },
      { name: "tickUpper", type: "int256[]" },
      { name: "numDiscoveryPositions", type: "uint16[]" },
      { name: "maxDiscoverySupplyShare", type: "uint256[]" },
    ],
    [
      POOL_CONFIG_VERSION,
      WETH_BASE,
      [BigInt(-TICK_RANGE * TICK_SPACING)], // tickLower
      [BigInt(TICK_RANGE * TICK_SPACING)],  // tickUpper
      [NUM_DISCOVERY_POSITIONS],
      [MAX_DISCOVERY_SUPPLY_SHARE],
    ]
  );
}
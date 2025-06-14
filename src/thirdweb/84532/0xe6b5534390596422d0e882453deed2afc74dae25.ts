import {
  prepareEvent,
  prepareContractCall,
  readContract,
  type BaseTransactionOptions,
  type AbiParameterToPrimitiveType,
} from "thirdweb";

/**
* Contract events
*/

/**
 * Represents the filters for the "RewardsClaimed" event.
 */
export type RewardsClaimedEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"user","type":"address"}>
}>;

/**
 * Creates an event object for the RewardsClaimed event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { rewardsClaimedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  rewardsClaimedEvent({
 *  user: ...,
 * })
 * ],
 * });
 * ```
 */
export function rewardsClaimedEvent(filters: RewardsClaimedEventFilters = {}) {
  return prepareEvent({
    signature: "event RewardsClaimed(address indexed user, uint256 amount)",
    filters,
  });
};
  



/**
 * Creates an event object for the RewardsDeposited event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { rewardsDepositedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  rewardsDepositedEvent()
 * ],
 * });
 * ```
 */
export function rewardsDepositedEvent() {
  return prepareEvent({
    signature: "event RewardsDeposited(uint256 amount)",
  });
};
  

/**
 * Represents the filters for the "RoleAdminChanged" event.
 */
export type RoleAdminChangedEventFilters = Partial<{
  role: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"}>
previousAdminRole: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"}>
newAdminRole: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}>
}>;

/**
 * Creates an event object for the RoleAdminChanged event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { roleAdminChangedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  roleAdminChangedEvent({
 *  role: ...,
 *  previousAdminRole: ...,
 *  newAdminRole: ...,
 * })
 * ],
 * });
 * ```
 */
export function roleAdminChangedEvent(filters: RoleAdminChangedEventFilters = {}) {
  return prepareEvent({
    signature: "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)",
    filters,
  });
};
  

/**
 * Represents the filters for the "RoleGranted" event.
 */
export type RoleGrantedEventFilters = Partial<{
  role: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"}>
account: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"account","type":"address"}>
sender: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"sender","type":"address"}>
}>;

/**
 * Creates an event object for the RoleGranted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { roleGrantedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  roleGrantedEvent({
 *  role: ...,
 *  account: ...,
 *  sender: ...,
 * })
 * ],
 * });
 * ```
 */
export function roleGrantedEvent(filters: RoleGrantedEventFilters = {}) {
  return prepareEvent({
    signature: "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    filters,
  });
};
  

/**
 * Represents the filters for the "RoleRevoked" event.
 */
export type RoleRevokedEventFilters = Partial<{
  role: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"}>
account: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"account","type":"address"}>
sender: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"sender","type":"address"}>
}>;

/**
 * Creates an event object for the RoleRevoked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { roleRevokedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  roleRevokedEvent({
 *  role: ...,
 *  account: ...,
 *  sender: ...,
 * })
 * ],
 * });
 * ```
 */
export function roleRevokedEvent(filters: RoleRevokedEventFilters = {}) {
  return prepareEvent({
    signature: "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
    filters,
  });
};
  

/**
 * Represents the filters for the "Staked" event.
 */
export type StakedEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"user","type":"address"}>
}>;

/**
 * Creates an event object for the Staked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { stakedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  stakedEvent({
 *  user: ...,
 * })
 * ],
 * });
 * ```
 */
export function stakedEvent(filters: StakedEventFilters = {}) {
  return prepareEvent({
    signature: "event Staked(address indexed user, uint256 amount)",
    filters,
  });
};
  

/**
 * Represents the filters for the "TokensLocked" event.
 */
export type TokensLockedEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"user","type":"address"}>
}>;

/**
 * Creates an event object for the TokensLocked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { tokensLockedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  tokensLockedEvent({
 *  user: ...,
 * })
 * ],
 * });
 * ```
 */
export function tokensLockedEvent(filters: TokensLockedEventFilters = {}) {
  return prepareEvent({
    signature: "event TokensLocked(address indexed user, uint256 amount)",
    filters,
  });
};
  

/**
 * Represents the filters for the "TokensSlashed" event.
 */
export type TokensSlashedEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"user","type":"address"}>
}>;

/**
 * Creates an event object for the TokensSlashed event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { tokensSlashedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  tokensSlashedEvent({
 *  user: ...,
 * })
 * ],
 * });
 * ```
 */
export function tokensSlashedEvent(filters: TokensSlashedEventFilters = {}) {
  return prepareEvent({
    signature: "event TokensSlashed(address indexed user, uint256 amount)",
    filters,
  });
};
  

/**
 * Represents the filters for the "TokensUnlocked" event.
 */
export type TokensUnlockedEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"user","type":"address"}>
}>;

/**
 * Creates an event object for the TokensUnlocked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { tokensUnlockedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  tokensUnlockedEvent({
 *  user: ...,
 * })
 * ],
 * });
 * ```
 */
export function tokensUnlockedEvent(filters: TokensUnlockedEventFilters = {}) {
  return prepareEvent({
    signature: "event TokensUnlocked(address indexed user, uint256 amount)",
    filters,
  });
};
  

/**
 * Represents the filters for the "Unstaked" event.
 */
export type UnstakedEventFilters = Partial<{
  user: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"user","type":"address"}>
}>;

/**
 * Creates an event object for the Unstaked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { unstakedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  unstakedEvent({
 *  user: ...,
 * })
 * ],
 * });
 * ```
 */
export function unstakedEvent(filters: UnstakedEventFilters = {}) {
  return prepareEvent({
    signature: "event Unstaked(address indexed user, uint256 amount)",
    filters,
  });
};
  

/**
* Contract read functions
*/



/**
 * Calls the "ATTESTATION_MANAGER_ROLE" function on the contract.
 * @param options - The options for the ATTESTATION_MANAGER_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { ATTESTATION_MANAGER_ROLE } from "TODO";
 *
 * const result = await ATTESTATION_MANAGER_ROLE();
 *
 * ```
 */
export async function ATTESTATION_MANAGER_ROLE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xcfef5e83",
  [],
  [
    {
      "internalType": "bytes32",
      "name": "",
      "type": "bytes32"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "DEFAULT_ADMIN_ROLE" function on the contract.
 * @param options - The options for the DEFAULT_ADMIN_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DEFAULT_ADMIN_ROLE } from "TODO";
 *
 * const result = await DEFAULT_ADMIN_ROLE();
 *
 * ```
 */
export async function DEFAULT_ADMIN_ROLE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xa217fddf",
  [],
  [
    {
      "internalType": "bytes32",
      "name": "",
      "type": "bytes32"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "MINIMUM_STAKE" function on the contract.
 * @param options - The options for the MINIMUM_STAKE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { MINIMUM_STAKE } from "TODO";
 *
 * const result = await MINIMUM_STAKE();
 *
 * ```
 */
export async function MINIMUM_STAKE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x08dbbb03",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "REWARDS_RATE" function on the contract.
 * @param options - The options for the REWARDS_RATE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { REWARDS_RATE } from "TODO";
 *
 * const result = await REWARDS_RATE();
 *
 * ```
 */
export async function REWARDS_RATE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xaf7807e1",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "SECONDS_PER_YEAR" function on the contract.
 * @param options - The options for the SECONDS_PER_YEAR function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { SECONDS_PER_YEAR } from "TODO";
 *
 * const result = await SECONDS_PER_YEAR();
 *
 * ```
 */
export async function SECONDS_PER_YEAR(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xe6a69ab8",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "SLASH_PERCENTAGE" function on the contract.
 * @param options - The options for the SLASH_PERCENTAGE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { SLASH_PERCENTAGE } from "TODO";
 *
 * const result = await SLASH_PERCENTAGE();
 *
 * ```
 */
export async function SLASH_PERCENTAGE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x9f29f135",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "canParticipateInAttestation" function.
 */
export type CanParticipateInAttestationParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
requiredStake: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"requiredStake","type":"uint256"}>
};

/**
 * Calls the "canParticipateInAttestation" function on the contract.
 * @param options - The options for the canParticipateInAttestation function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { canParticipateInAttestation } from "TODO";
 *
 * const result = await canParticipateInAttestation({
 *  user: ...,
 *  requiredStake: ...,
 * });
 *
 * ```
 */
export async function canParticipateInAttestation(
  options: BaseTransactionOptions<CanParticipateInAttestationParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x00e3c352",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "requiredStake",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ]
],
    params: [options.user, options.requiredStake]
  });
};


/**
 * Represents the parameters for the "getAvailableStake" function.
 */
export type GetAvailableStakeParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "getAvailableStake" function on the contract.
 * @param options - The options for the getAvailableStake function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getAvailableStake } from "TODO";
 *
 * const result = await getAvailableStake({
 *  user: ...,
 * });
 *
 * ```
 */
export async function getAvailableStake(
  options: BaseTransactionOptions<GetAvailableStakeParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x14f6b190",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.user]
  });
};


/**
 * Represents the parameters for the "getPendingRewards" function.
 */
export type GetPendingRewardsParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "getPendingRewards" function on the contract.
 * @param options - The options for the getPendingRewards function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getPendingRewards } from "TODO";
 *
 * const result = await getPendingRewards({
 *  user: ...,
 * });
 *
 * ```
 */
export async function getPendingRewards(
  options: BaseTransactionOptions<GetPendingRewardsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xf6ed2017",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.user]
  });
};


/**
 * Represents the parameters for the "getRoleAdmin" function.
 */
export type GetRoleAdminParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
};

/**
 * Calls the "getRoleAdmin" function on the contract.
 * @param options - The options for the getRoleAdmin function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRoleAdmin } from "TODO";
 *
 * const result = await getRoleAdmin({
 *  role: ...,
 * });
 *
 * ```
 */
export async function getRoleAdmin(
  options: BaseTransactionOptions<GetRoleAdminParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x248a9ca3",
  [
    {
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
    }
  ],
  [
    {
      "internalType": "bytes32",
      "name": "",
      "type": "bytes32"
    }
  ]
],
    params: [options.role]
  });
};


/**
 * Represents the parameters for the "hasRole" function.
 */
export type HasRoleParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
account: AbiParameterToPrimitiveType<{"internalType":"address","name":"account","type":"address"}>
};

/**
 * Calls the "hasRole" function on the contract.
 * @param options - The options for the hasRole function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { hasRole } from "TODO";
 *
 * const result = await hasRole({
 *  role: ...,
 *  account: ...,
 * });
 *
 * ```
 */
export async function hasRole(
  options: BaseTransactionOptions<HasRoleParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x91d14854",
  [
    {
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
    },
    {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ]
],
    params: [options.role, options.account]
  });
};




/**
 * Calls the "hotdogToken" function on the contract.
 * @param options - The options for the hotdogToken function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { hotdogToken } from "TODO";
 *
 * const result = await hotdogToken();
 *
 * ```
 */
export async function hotdogToken(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x8a981c2a",
  [],
  [
    {
      "internalType": "contract HotdogToken",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "lockedForAttestation" function.
 */
export type LockedForAttestationParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
};

/**
 * Calls the "lockedForAttestation" function on the contract.
 * @param options - The options for the lockedForAttestation function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { lockedForAttestation } from "TODO";
 *
 * const result = await lockedForAttestation({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function lockedForAttestation(
  options: BaseTransactionOptions<LockedForAttestationParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x73d50a42",
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.arg_0]
  });
};




/**
 * Calls the "rewardsPool" function on the contract.
 * @param options - The options for the rewardsPool function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { rewardsPool } from "TODO";
 *
 * const result = await rewardsPool();
 *
 * ```
 */
export async function rewardsPool(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x0359fea9",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "stakes" function.
 */
export type StakesParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
};

/**
 * Calls the "stakes" function on the contract.
 * @param options - The options for the stakes function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { stakes } from "TODO";
 *
 * const result = await stakes({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function stakes(
  options: BaseTransactionOptions<StakesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x16934fc4",
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "lastRewardTime",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "pendingRewards",
      "type": "uint256"
    },
    {
      "internalType": "bool",
      "name": "isActive",
      "type": "bool"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "supportsInterface" function.
 */
export type SupportsInterfaceParams = {
  interfaceId: AbiParameterToPrimitiveType<{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}>
};

/**
 * Calls the "supportsInterface" function on the contract.
 * @param options - The options for the supportsInterface function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { supportsInterface } from "TODO";
 *
 * const result = await supportsInterface({
 *  interfaceId: ...,
 * });
 *
 * ```
 */
export async function supportsInterface(
  options: BaseTransactionOptions<SupportsInterfaceParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x01ffc9a7",
  [
    {
      "internalType": "bytes4",
      "name": "interfaceId",
      "type": "bytes4"
    }
  ],
  [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ]
],
    params: [options.interfaceId]
  });
};




/**
 * Calls the "totalStaked" function on the contract.
 * @param options - The options for the totalStaked function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { totalStaked } from "TODO";
 *
 * const result = await totalStaked();
 *
 * ```
 */
export async function totalStaked(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x817b1cd2",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};


/**
* Contract write functions
*/

/**
 * Represents the parameters for the "addAttestationManager" function.
 */
export type AddAttestationManagerParams = {
  manager: AbiParameterToPrimitiveType<{"internalType":"address","name":"manager","type":"address"}>
};

/**
 * Calls the "addAttestationManager" function on the contract.
 * @param options - The options for the "addAttestationManager" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { addAttestationManager } from "TODO";
 *
 * const transaction = addAttestationManager({
 *  manager: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function addAttestationManager(
  options: BaseTransactionOptions<AddAttestationManagerParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x285bda1e",
  [
    {
      "internalType": "address",
      "name": "manager",
      "type": "address"
    }
  ],
  []
],
    params: [options.manager]
  });
};




/**
 * Calls the "claimRewards" function on the contract.
 * @param options - The options for the "claimRewards" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { claimRewards } from "TODO";
 *
 * const transaction = claimRewards();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function claimRewards(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x372500ab",
  [],
  []
],
    params: []
  });
};


/**
 * Represents the parameters for the "depositRewards" function.
 */
export type DepositRewardsParams = {
  amount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"amount","type":"uint256"}>
};

/**
 * Calls the "depositRewards" function on the contract.
 * @param options - The options for the "depositRewards" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { depositRewards } from "TODO";
 *
 * const transaction = depositRewards({
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function depositRewards(
  options: BaseTransactionOptions<DepositRewardsParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x8bdf67f2",
  [
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.amount]
  });
};


/**
 * Represents the parameters for the "distributeAttestationRewards" function.
 */
export type DistributeAttestationRewardsParams = {
  winners: AbiParameterToPrimitiveType<{"internalType":"address[]","name":"winners","type":"address[]"}>
amounts: AbiParameterToPrimitiveType<{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}>
};

/**
 * Calls the "distributeAttestationRewards" function on the contract.
 * @param options - The options for the "distributeAttestationRewards" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { distributeAttestationRewards } from "TODO";
 *
 * const transaction = distributeAttestationRewards({
 *  winners: ...,
 *  amounts: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function distributeAttestationRewards(
  options: BaseTransactionOptions<DistributeAttestationRewardsParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x63e68646",
  [
    {
      "internalType": "address[]",
      "name": "winners",
      "type": "address[]"
    },
    {
      "internalType": "uint256[]",
      "name": "amounts",
      "type": "uint256[]"
    }
  ],
  []
],
    params: [options.winners, options.amounts]
  });
};


/**
 * Represents the parameters for the "grantRole" function.
 */
export type GrantRoleParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
account: AbiParameterToPrimitiveType<{"internalType":"address","name":"account","type":"address"}>
};

/**
 * Calls the "grantRole" function on the contract.
 * @param options - The options for the "grantRole" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { grantRole } from "TODO";
 *
 * const transaction = grantRole({
 *  role: ...,
 *  account: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function grantRole(
  options: BaseTransactionOptions<GrantRoleParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x2f2ff15d",
  [
    {
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
    },
    {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }
  ],
  []
],
    params: [options.role, options.account]
  });
};


/**
 * Represents the parameters for the "lockTokensForAttestation" function.
 */
export type LockTokensForAttestationParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
amount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"amount","type":"uint256"}>
};

/**
 * Calls the "lockTokensForAttestation" function on the contract.
 * @param options - The options for the "lockTokensForAttestation" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { lockTokensForAttestation } from "TODO";
 *
 * const transaction = lockTokensForAttestation({
 *  user: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function lockTokensForAttestation(
  options: BaseTransactionOptions<LockTokensForAttestationParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x1725b73d",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.user, options.amount]
  });
};


/**
 * Represents the parameters for the "renounceRole" function.
 */
export type RenounceRoleParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
callerConfirmation: AbiParameterToPrimitiveType<{"internalType":"address","name":"callerConfirmation","type":"address"}>
};

/**
 * Calls the "renounceRole" function on the contract.
 * @param options - The options for the "renounceRole" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { renounceRole } from "TODO";
 *
 * const transaction = renounceRole({
 *  role: ...,
 *  callerConfirmation: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function renounceRole(
  options: BaseTransactionOptions<RenounceRoleParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x36568abe",
  [
    {
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
    },
    {
      "internalType": "address",
      "name": "callerConfirmation",
      "type": "address"
    }
  ],
  []
],
    params: [options.role, options.callerConfirmation]
  });
};


/**
 * Represents the parameters for the "revokeRole" function.
 */
export type RevokeRoleParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
account: AbiParameterToPrimitiveType<{"internalType":"address","name":"account","type":"address"}>
};

/**
 * Calls the "revokeRole" function on the contract.
 * @param options - The options for the "revokeRole" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { revokeRole } from "TODO";
 *
 * const transaction = revokeRole({
 *  role: ...,
 *  account: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function revokeRole(
  options: BaseTransactionOptions<RevokeRoleParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xd547741f",
  [
    {
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
    },
    {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }
  ],
  []
],
    params: [options.role, options.account]
  });
};


/**
 * Represents the parameters for the "slashTokens" function.
 */
export type SlashTokensParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
amount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"amount","type":"uint256"}>
};

/**
 * Calls the "slashTokens" function on the contract.
 * @param options - The options for the "slashTokens" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { slashTokens } from "TODO";
 *
 * const transaction = slashTokens({
 *  user: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function slashTokens(
  options: BaseTransactionOptions<SlashTokensParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x4c5bc3f9",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.user, options.amount]
  });
};


/**
 * Represents the parameters for the "stake" function.
 */
export type StakeParams = {
  amount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"amount","type":"uint256"}>
};

/**
 * Calls the "stake" function on the contract.
 * @param options - The options for the "stake" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { stake } from "TODO";
 *
 * const transaction = stake({
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function stake(
  options: BaseTransactionOptions<StakeParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xa694fc3a",
  [
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.amount]
  });
};


/**
 * Represents the parameters for the "unlockTokensFromAttestation" function.
 */
export type UnlockTokensFromAttestationParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
amount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"amount","type":"uint256"}>
};

/**
 * Calls the "unlockTokensFromAttestation" function on the contract.
 * @param options - The options for the "unlockTokensFromAttestation" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { unlockTokensFromAttestation } from "TODO";
 *
 * const transaction = unlockTokensFromAttestation({
 *  user: ...,
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function unlockTokensFromAttestation(
  options: BaseTransactionOptions<UnlockTokensFromAttestationParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x57381629",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.user, options.amount]
  });
};


/**
 * Represents the parameters for the "unstake" function.
 */
export type UnstakeParams = {
  amount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"amount","type":"uint256"}>
};

/**
 * Calls the "unstake" function on the contract.
 * @param options - The options for the "unstake" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { unstake } from "TODO";
 *
 * const transaction = unstake({
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function unstake(
  options: BaseTransactionOptions<UnstakeParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x2e17de78",
  [
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.amount]
  });
};



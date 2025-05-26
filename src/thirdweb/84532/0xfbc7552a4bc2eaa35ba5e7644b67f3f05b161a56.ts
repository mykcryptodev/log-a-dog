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
 * Represents the filters for the "AttestationMade" event.
 */
export type AttestationMadeEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
attestor: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"attestor","type":"address"}>
}>;

/**
 * Creates an event object for the AttestationMade event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { attestationMadeEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  attestationMadeEvent({
 *  logId: ...,
 *  attestor: ...,
 * })
 * ],
 * });
 * ```
 */
export function attestationMadeEvent(filters: AttestationMadeEventFilters = {}) {
  return prepareEvent({
    signature: "event AttestationMade(uint256 indexed logId, address indexed attestor, bool isValid, uint256 stakeAmount)",
    filters,
  });
};
  

/**
 * Represents the filters for the "AttestationPeriodResolved" event.
 */
export type AttestationPeriodResolvedEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
}>;

/**
 * Creates an event object for the AttestationPeriodResolved event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { attestationPeriodResolvedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  attestationPeriodResolvedEvent({
 *  logId: ...,
 * })
 * ],
 * });
 * ```
 */
export function attestationPeriodResolvedEvent(filters: AttestationPeriodResolvedEventFilters = {}) {
  return prepareEvent({
    signature: "event AttestationPeriodResolved(uint256 indexed logId, bool isValid, uint256 totalValidStake, uint256 totalInvalidStake)",
    filters,
  });
};
  

/**
 * Represents the filters for the "AttestationPeriodStarted" event.
 */
export type AttestationPeriodStartedEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
}>;

/**
 * Creates an event object for the AttestationPeriodStarted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { attestationPeriodStartedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  attestationPeriodStartedEvent({
 *  logId: ...,
 * })
 * ],
 * });
 * ```
 */
export function attestationPeriodStartedEvent(filters: AttestationPeriodStartedEventFilters = {}) {
  return prepareEvent({
    signature: "event AttestationPeriodStarted(uint256 indexed logId, uint256 startTime, uint256 endTime)",
    filters,
  });
};
  

/**
 * Represents the filters for the "RewardsDistributed" event.
 */
export type RewardsDistributedEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
}>;

/**
 * Creates an event object for the RewardsDistributed event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { rewardsDistributedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  rewardsDistributedEvent({
 *  logId: ...,
 * })
 * ],
 * });
 * ```
 */
export function rewardsDistributedEvent(filters: RewardsDistributedEventFilters = {}) {
  return prepareEvent({
    signature: "event RewardsDistributed(uint256 indexed logId, address[] winners, uint256[] amounts)",
    filters,
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
 * Represents the filters for the "TokensSlashed" event.
 */
export type TokensSlashedEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
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
 *  logId: ...,
 * })
 * ],
 * });
 * ```
 */
export function tokensSlashedEvent(filters: TokensSlashedEventFilters = {}) {
  return prepareEvent({
    signature: "event TokensSlashed(uint256 indexed logId, address[] losers, uint256[] amounts)",
    filters,
  });
};
  

/**
* Contract read functions
*/



/**
 * Calls the "ATTESTATION_WINDOW" function on the contract.
 * @param options - The options for the ATTESTATION_WINDOW function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { ATTESTATION_WINDOW } from "TODO";
 *
 * const result = await ATTESTATION_WINDOW();
 *
 * ```
 */
export async function ATTESTATION_WINDOW(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xc5abc665",
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
 * Calls the "LOG_MANAGER_ROLE" function on the contract.
 * @param options - The options for the LOG_MANAGER_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { LOG_MANAGER_ROLE } from "TODO";
 *
 * const result = await LOG_MANAGER_ROLE();
 *
 * ```
 */
export async function LOG_MANAGER_ROLE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xdf0531fd",
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
 * Calls the "MINIMUM_ATTESTATION_STAKE" function on the contract.
 * @param options - The options for the MINIMUM_ATTESTATION_STAKE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { MINIMUM_ATTESTATION_STAKE } from "TODO";
 *
 * const result = await MINIMUM_ATTESTATION_STAKE();
 *
 * ```
 */
export async function MINIMUM_ATTESTATION_STAKE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x0b16b542",
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
 * Represents the parameters for the "attestationPeriods" function.
 */
export type AttestationPeriodsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "attestationPeriods" function on the contract.
 * @param options - The options for the attestationPeriods function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { attestationPeriods } from "TODO";
 *
 * const result = await attestationPeriods({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function attestationPeriods(
  options: BaseTransactionOptions<AttestationPeriodsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x318193c9",
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "startTime",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "endTime",
      "type": "uint256"
    },
    {
      "internalType": "enum AttestationManager.AttestationStatus",
      "name": "status",
      "type": "uint8"
    },
    {
      "internalType": "uint256",
      "name": "totalValidStake",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "totalInvalidStake",
      "type": "uint256"
    },
    {
      "internalType": "bool",
      "name": "isValid",
      "type": "bool"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "getAttestationPeriod" function.
 */
export type GetAttestationPeriodParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "getAttestationPeriod" function on the contract.
 * @param options - The options for the getAttestationPeriod function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getAttestationPeriod } from "TODO";
 *
 * const result = await getAttestationPeriod({
 *  logId: ...,
 * });
 *
 * ```
 */
export async function getAttestationPeriod(
  options: BaseTransactionOptions<GetAttestationPeriodParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x2f99b231",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "startTime",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "endTime",
      "type": "uint256"
    },
    {
      "internalType": "enum AttestationManager.AttestationStatus",
      "name": "status",
      "type": "uint8"
    },
    {
      "internalType": "uint256",
      "name": "totalValidStake",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "totalInvalidStake",
      "type": "uint256"
    },
    {
      "internalType": "bool",
      "name": "isValid",
      "type": "bool"
    }
  ]
],
    params: [options.logId]
  });
};


/**
 * Represents the parameters for the "getAttestors" function.
 */
export type GetAttestorsParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "getAttestors" function on the contract.
 * @param options - The options for the getAttestors function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getAttestors } from "TODO";
 *
 * const result = await getAttestors({
 *  logId: ...,
 * });
 *
 * ```
 */
export async function getAttestors(
  options: BaseTransactionOptions<GetAttestorsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xf2a20ea9",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "address[]",
      "name": "validAttestors",
      "type": "address[]"
    },
    {
      "internalType": "address[]",
      "name": "invalidAttestors",
      "type": "address[]"
    }
  ]
],
    params: [options.logId]
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
 * Represents the parameters for the "getUserAttestations" function.
 */
export type GetUserAttestationsParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "getUserAttestations" function on the contract.
 * @param options - The options for the getUserAttestations function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getUserAttestations } from "TODO";
 *
 * const result = await getUserAttestations({
 *  user: ...,
 * });
 *
 * ```
 */
export async function getUserAttestations(
  options: BaseTransactionOptions<GetUserAttestationsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x9658e1ef",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "uint256[]",
      "name": "",
      "type": "uint256[]"
    }
  ]
],
    params: [options.user]
  });
};


/**
 * Represents the parameters for the "getUserAttestationsWithChoices" function.
 */
export type GetUserAttestationsWithChoicesParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "getUserAttestationsWithChoices" function on the contract.
 * @param options - The options for the getUserAttestationsWithChoices function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getUserAttestationsWithChoices } from "TODO";
 *
 * const result = await getUserAttestationsWithChoices({
 *  user: ...,
 * });
 *
 * ```
 */
export async function getUserAttestationsWithChoices(
  options: BaseTransactionOptions<GetUserAttestationsWithChoicesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x20d2ec41",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "uint256[]",
      "name": "logIds",
      "type": "uint256[]"
    },
    {
      "internalType": "bool[]",
      "name": "choices",
      "type": "bool[]"
    }
  ]
],
    params: [options.user]
  });
};


/**
 * Represents the parameters for the "getUserStakeInAttestation" function.
 */
export type GetUserStakeInAttestationParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "getUserStakeInAttestation" function on the contract.
 * @param options - The options for the getUserStakeInAttestation function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getUserStakeInAttestation } from "TODO";
 *
 * const result = await getUserStakeInAttestation({
 *  logId: ...,
 *  user: ...,
 * });
 *
 * ```
 */
export async function getUserStakeInAttestation(
  options: BaseTransactionOptions<GetUserStakeInAttestationParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xe805e555",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    },
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
    params: [options.logId, options.user]
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
 * Represents the parameters for the "hasUserAttested" function.
 */
export type HasUserAttestedParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "hasUserAttested" function on the contract.
 * @param options - The options for the hasUserAttested function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { hasUserAttested } from "TODO";
 *
 * const result = await hasUserAttested({
 *  logId: ...,
 *  user: ...,
 * });
 *
 * ```
 */
export async function hasUserAttested(
  options: BaseTransactionOptions<HasUserAttestedParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x48dc6ce0",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "user",
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
    params: [options.logId, options.user]
  });
};


/**
 * Represents the parameters for the "isAttestationPeriodActive" function.
 */
export type IsAttestationPeriodActiveParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "isAttestationPeriodActive" function on the contract.
 * @param options - The options for the isAttestationPeriodActive function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { isAttestationPeriodActive } from "TODO";
 *
 * const result = await isAttestationPeriodActive({
 *  logId: ...,
 * });
 *
 * ```
 */
export async function isAttestationPeriodActive(
  options: BaseTransactionOptions<IsAttestationPeriodActiveParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x86708e17",
  [
    {
      "internalType": "uint256",
      "name": "logId",
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
    params: [options.logId]
  });
};




/**
 * Calls the "logADogContract" function on the contract.
 * @param options - The options for the logADogContract function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { logADogContract } from "TODO";
 *
 * const result = await logADogContract();
 *
 * ```
 */
export async function logADogContract(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xa320795a",
  [],
  [
    {
      "internalType": "contract ILogADog",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "stakingContract" function on the contract.
 * @param options - The options for the stakingContract function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { stakingContract } from "TODO";
 *
 * const result = await stakingContract();
 *
 * ```
 */
export async function stakingContract(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xee99205c",
  [],
  [
    {
      "internalType": "contract HotdogStaking",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
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
 * Represents the parameters for the "userAttestationChoices" function.
 */
export type UserAttestationChoicesParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
arg_1: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "userAttestationChoices" function on the contract.
 * @param options - The options for the userAttestationChoices function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { userAttestationChoices } from "TODO";
 *
 * const result = await userAttestationChoices({
 *  arg_0: ...,
 *  arg_1: ...,
 * });
 *
 * ```
 */
export async function userAttestationChoices(
  options: BaseTransactionOptions<UserAttestationChoicesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x526232a1",
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "",
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
    params: [options.arg_0, options.arg_1]
  });
};


/**
 * Represents the parameters for the "userAttestations" function.
 */
export type UserAttestationsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
arg_1: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "userAttestations" function on the contract.
 * @param options - The options for the userAttestations function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { userAttestations } from "TODO";
 *
 * const result = await userAttestations({
 *  arg_0: ...,
 *  arg_1: ...,
 * });
 *
 * ```
 */
export async function userAttestations(
  options: BaseTransactionOptions<UserAttestationsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x1cf2bbc9",
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
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
    params: [options.arg_0, options.arg_1]
  });
};


/**
* Contract write functions
*/

/**
 * Represents the parameters for the "addLogManager" function.
 */
export type AddLogManagerParams = {
  manager: AbiParameterToPrimitiveType<{"internalType":"address","name":"manager","type":"address"}>
};

/**
 * Calls the "addLogManager" function on the contract.
 * @param options - The options for the "addLogManager" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { addLogManager } from "TODO";
 *
 * const transaction = addLogManager({
 *  manager: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function addLogManager(
  options: BaseTransactionOptions<AddLogManagerParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x12111282",
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
 * Represents the parameters for the "attestToLog" function.
 */
export type AttestToLogParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
isValid: AbiParameterToPrimitiveType<{"internalType":"bool","name":"isValid","type":"bool"}>
stakeAmount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"stakeAmount","type":"uint256"}>
};

/**
 * Calls the "attestToLog" function on the contract.
 * @param options - The options for the "attestToLog" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { attestToLog } from "TODO";
 *
 * const transaction = attestToLog({
 *  logId: ...,
 *  isValid: ...,
 *  stakeAmount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function attestToLog(
  options: BaseTransactionOptions<AttestToLogParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x50255756",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    },
    {
      "internalType": "bool",
      "name": "isValid",
      "type": "bool"
    },
    {
      "internalType": "uint256",
      "name": "stakeAmount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.logId, options.isValid, options.stakeAmount]
  });
};


/**
 * Represents the parameters for the "attestToLogOnBehalf" function.
 */
export type AttestToLogOnBehalfParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
attestor: AbiParameterToPrimitiveType<{"internalType":"address","name":"attestor","type":"address"}>
isValid: AbiParameterToPrimitiveType<{"internalType":"bool","name":"isValid","type":"bool"}>
stakeAmount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"stakeAmount","type":"uint256"}>
};

/**
 * Calls the "attestToLogOnBehalf" function on the contract.
 * @param options - The options for the "attestToLogOnBehalf" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { attestToLogOnBehalf } from "TODO";
 *
 * const transaction = attestToLogOnBehalf({
 *  logId: ...,
 *  attestor: ...,
 *  isValid: ...,
 *  stakeAmount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function attestToLogOnBehalf(
  options: BaseTransactionOptions<AttestToLogOnBehalfParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x152c7805",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "attestor",
      "type": "address"
    },
    {
      "internalType": "bool",
      "name": "isValid",
      "type": "bool"
    },
    {
      "internalType": "uint256",
      "name": "stakeAmount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.logId, options.attestor, options.isValid, options.stakeAmount]
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
 * Represents the parameters for the "resolveAttestationPeriod" function.
 */
export type ResolveAttestationPeriodParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "resolveAttestationPeriod" function on the contract.
 * @param options - The options for the "resolveAttestationPeriod" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { resolveAttestationPeriod } from "TODO";
 *
 * const transaction = resolveAttestationPeriod({
 *  logId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function resolveAttestationPeriod(
  options: BaseTransactionOptions<ResolveAttestationPeriodParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x01afa8d0",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.logId]
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
 * Represents the parameters for the "setLogADogContract" function.
 */
export type SetLogADogContractParams = {
  logADogContract: AbiParameterToPrimitiveType<{"internalType":"address","name":"_logADogContract","type":"address"}>
};

/**
 * Calls the "setLogADogContract" function on the contract.
 * @param options - The options for the "setLogADogContract" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setLogADogContract } from "TODO";
 *
 * const transaction = setLogADogContract({
 *  logADogContract: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setLogADogContract(
  options: BaseTransactionOptions<SetLogADogContractParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x76cd9cb0",
  [
    {
      "internalType": "address",
      "name": "_logADogContract",
      "type": "address"
    }
  ],
  []
],
    params: [options.logADogContract]
  });
};


/**
 * Represents the parameters for the "startAttestationPeriod" function.
 */
export type StartAttestationPeriodParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "startAttestationPeriod" function on the contract.
 * @param options - The options for the "startAttestationPeriod" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { startAttestationPeriod } from "TODO";
 *
 * const transaction = startAttestationPeriod({
 *  logId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function startAttestationPeriod(
  options: BaseTransactionOptions<StartAttestationPeriodParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xdf286f4c",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.logId]
  });
};



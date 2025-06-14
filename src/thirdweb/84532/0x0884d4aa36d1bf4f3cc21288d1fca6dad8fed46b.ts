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
    signature: "event AttestationMade(uint256 indexed logId, address indexed attestor, bool isValid)",
    filters,
  });
};
  

/**
 * Represents the filters for the "AttestationRevoked" event.
 */
export type AttestationRevokedEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
attestor: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"attestor","type":"address"}>
}>;

/**
 * Creates an event object for the AttestationRevoked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { attestationRevokedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  attestationRevokedEvent({
 *  logId: ...,
 *  attestor: ...,
 * })
 * ],
 * });
 * ```
 */
export function attestationRevokedEvent(filters: AttestationRevokedEventFilters = {}) {
  return prepareEvent({
    signature: "event AttestationRevoked(uint256 indexed logId, address indexed attestor)",
    filters,
  });
};
  



/**
 * Creates an event object for the DebugInfo event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { debugInfoEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  debugInfoEvent()
 * ],
 * });
 * ```
 */
export function debugInfoEvent() {
  return prepareEvent({
    signature: "event DebugInfo(uint256 msgValue, uint256 contractBalance)",
  });
};
  

/**
 * Represents the filters for the "HotdogLogRevoked" event.
 */
export type HotdogLogRevokedEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
logger: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"logger","type":"address"}>
}>;

/**
 * Creates an event object for the HotdogLogRevoked event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { hotdogLogRevokedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  hotdogLogRevokedEvent({
 *  logId: ...,
 *  logger: ...,
 * })
 * ],
 * });
 * ```
 */
export function hotdogLogRevokedEvent(filters: HotdogLogRevokedEventFilters = {}) {
  return prepareEvent({
    signature: "event HotdogLogRevoked(uint256 indexed logId, address indexed logger)",
    filters,
  });
};
  

/**
 * Represents the filters for the "HotdogLogged" event.
 */
export type HotdogLoggedEventFilters = Partial<{
  logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"logId","type":"uint256"}>
logger: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"logger","type":"address"}>
eater: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"eater","type":"address"}>
}>;

/**
 * Creates an event object for the HotdogLogged event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { hotdogLoggedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  hotdogLoggedEvent({
 *  logId: ...,
 *  logger: ...,
 *  eater: ...,
 * })
 * ],
 * });
 * ```
 */
export function hotdogLoggedEvent(filters: HotdogLoggedEventFilters = {}) {
  return prepareEvent({
    signature: "event HotdogLogged(uint256 indexed logId, address indexed logger, address indexed eater, string imageUri, string metadataUri, uint256 timestamp, address zoraCoin)",
    filters,
  });
};
  

/**
 * Represents the filters for the "OperatorAdded" event.
 */
export type OperatorAddedEventFilters = Partial<{
  operator: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"operator","type":"address"}>
}>;

/**
 * Creates an event object for the OperatorAdded event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { operatorAddedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  operatorAddedEvent({
 *  operator: ...,
 * })
 * ],
 * });
 * ```
 */
export function operatorAddedEvent(filters: OperatorAddedEventFilters = {}) {
  return prepareEvent({
    signature: "event OperatorAdded(address indexed operator)",
    filters,
  });
};
  

/**
 * Represents the filters for the "OperatorRemoved" event.
 */
export type OperatorRemovedEventFilters = Partial<{
  operator: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"operator","type":"address"}>
}>;

/**
 * Creates an event object for the OperatorRemoved event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { operatorRemovedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  operatorRemovedEvent({
 *  operator: ...,
 * })
 * ],
 * });
 * ```
 */
export function operatorRemovedEvent(filters: OperatorRemovedEventFilters = {}) {
  return prepareEvent({
    signature: "event OperatorRemoved(address indexed operator)",
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
* Contract read functions
*/



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
 * Calls the "OPERATOR_ROLE" function on the contract.
 * @param options - The options for the OPERATOR_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { OPERATOR_ROLE } from "TODO";
 *
 * const result = await OPERATOR_ROLE();
 *
 * ```
 */
export async function OPERATOR_ROLE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xf5b541a6",
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
 * Represents the parameters for the "attestHotdogLog" function.
 */
export type AttestHotdogLogParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
arg_1: AbiParameterToPrimitiveType<{"internalType":"bool","name":"","type":"bool"}>
arg_2: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "attestHotdogLog" function on the contract.
 * @param options - The options for the attestHotdogLog function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { attestHotdogLog } from "TODO";
 *
 * const result = await attestHotdogLog({
 *  arg_0: ...,
 *  arg_1: ...,
 *  arg_2: ...,
 * });
 *
 * ```
 */
export async function attestHotdogLog(
  options: BaseTransactionOptions<AttestHotdogLogParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xbbc8d3f7",
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    },
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    },
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.arg_0, options.arg_1, options.arg_2]
  });
};




/**
 * Calls the "attestationManager" function on the contract.
 * @param options - The options for the attestationManager function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { attestationManager } from "TODO";
 *
 * const result = await attestationManager();
 *
 * ```
 */
export async function attestationManager(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xb1c16bf1",
  [],
  [
    {
      "internalType": "contract AttestationManager",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "attestations" function.
 */
export type AttestationsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
arg_1: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "attestations" function on the contract.
 * @param options - The options for the attestations function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { attestations } from "TODO";
 *
 * const result = await attestations({
 *  arg_0: ...,
 *  arg_1: ...,
 * });
 *
 * ```
 */
export async function attestations(
  options: BaseTransactionOptions<AttestationsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xdd03888e",
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "address",
      "name": "attestor",
      "type": "address"
    },
    {
      "internalType": "bool",
      "name": "isValid",
      "type": "bool"
    }
  ]
],
    params: [options.arg_0, options.arg_1]
  });
};




/**
 * Calls the "coinDeploymentManager" function on the contract.
 * @param options - The options for the coinDeploymentManager function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { coinDeploymentManager } from "TODO";
 *
 * const result = await coinDeploymentManager();
 *
 * ```
 */
export async function coinDeploymentManager(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x4f902b14",
  [],
  [
    {
      "internalType": "contract CoinDeploymentManager",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "getAttestationCount" function.
 */
export type GetAttestationCountParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "getAttestationCount" function on the contract.
 * @param options - The options for the getAttestationCount function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getAttestationCount } from "TODO";
 *
 * const result = await getAttestationCount({
 *  logId: ...,
 * });
 *
 * ```
 */
export async function getAttestationCount(
  options: BaseTransactionOptions<GetAttestationCountParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xff1f94b5",
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
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.logId]
  });
};


/**
 * Represents the parameters for the "getHotdogLog" function.
 */
export type GetHotdogLogParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "getHotdogLog" function on the contract.
 * @param options - The options for the getHotdogLog function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getHotdogLog } from "TODO";
 *
 * const result = await getHotdogLog({
 *  logId: ...,
 * });
 *
 * ```
 */
export async function getHotdogLog(
  options: BaseTransactionOptions<GetHotdogLogParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xa4d413b0",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    }
  ],
  [
    {
      "components": [
        {
          "internalType": "uint256",
          "name": "logId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "imageUri",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "metadataUri",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "eater",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "logger",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "zoraCoin",
          "type": "address"
        }
      ],
      "internalType": "struct LogADog.HotdogLog",
      "name": "log",
      "type": "tuple"
    },
    {
      "internalType": "uint256",
      "name": "validCount",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "invalidCount",
      "type": "uint256"
    }
  ]
],
    params: [options.logId]
  });
};


/**
 * Represents the parameters for the "getHotdogLogs" function.
 */
export type GetHotdogLogsParams = {
  startTime: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"startTime","type":"uint256"}>
endTime: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"endTime","type":"uint256"}>
user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
start: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"start","type":"uint256"}>
limit: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"limit","type":"uint256"}>
};

/**
 * Calls the "getHotdogLogs" function on the contract.
 * @param options - The options for the getHotdogLogs function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getHotdogLogs } from "TODO";
 *
 * const result = await getHotdogLogs({
 *  startTime: ...,
 *  endTime: ...,
 *  user: ...,
 *  start: ...,
 *  limit: ...,
 * });
 *
 * ```
 */
export async function getHotdogLogs(
  options: BaseTransactionOptions<GetHotdogLogsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x3a5c39f7",
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
      "internalType": "address",
      "name": "user",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "start",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "limit",
      "type": "uint256"
    }
  ],
  [
    {
      "components": [
        {
          "internalType": "uint256",
          "name": "logId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "imageUri",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "metadataUri",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "eater",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "logger",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "zoraCoin",
          "type": "address"
        }
      ],
      "internalType": "struct LogADog.HotdogLog[]",
      "name": "logs",
      "type": "tuple[]"
    },
    {
      "internalType": "uint256[]",
      "name": "validCounts",
      "type": "uint256[]"
    },
    {
      "internalType": "uint256[]",
      "name": "invalidCounts",
      "type": "uint256[]"
    },
    {
      "internalType": "bool[]",
      "name": "userHasAttested",
      "type": "bool[]"
    },
    {
      "internalType": "bool[]",
      "name": "userAttestations",
      "type": "bool[]"
    }
  ]
],
    params: [options.startTime, options.endTime, options.user, options.start, options.limit]
  });
};




/**
 * Calls the "getHotdogLogsCount" function on the contract.
 * @param options - The options for the getHotdogLogsCount function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getHotdogLogsCount } from "TODO";
 *
 * const result = await getHotdogLogsCount();
 *
 * ```
 */
export async function getHotdogLogsCount(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xcf2b6278",
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
 * Represents the parameters for the "getHotdogLogsRange" function.
 */
export type GetHotdogLogsRangeParams = {
  start: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"start","type":"uint256"}>
limit: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"limit","type":"uint256"}>
};

/**
 * Calls the "getHotdogLogsRange" function on the contract.
 * @param options - The options for the getHotdogLogsRange function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getHotdogLogsRange } from "TODO";
 *
 * const result = await getHotdogLogsRange({
 *  start: ...,
 *  limit: ...,
 * });
 *
 * ```
 */
export async function getHotdogLogsRange(
  options: BaseTransactionOptions<GetHotdogLogsRangeParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xdb86c6b4",
  [
    {
      "internalType": "uint256",
      "name": "start",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "limit",
      "type": "uint256"
    }
  ],
  [
    {
      "components": [
        {
          "internalType": "uint256",
          "name": "logId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "imageUri",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "metadataUri",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "eater",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "logger",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "zoraCoin",
          "type": "address"
        }
      ],
      "internalType": "struct LogADog.HotdogLog[]",
      "name": "logs",
      "type": "tuple[]"
    }
  ]
],
    params: [options.start, options.limit]
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
 * Represents the parameters for the "getTotalPagesForLogs" function.
 */
export type GetTotalPagesForLogsParams = {
  startTime: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"startTime","type":"uint256"}>
endTime: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"endTime","type":"uint256"}>
pageSize: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"pageSize","type":"uint256"}>
};

/**
 * Calls the "getTotalPagesForLogs" function on the contract.
 * @param options - The options for the getTotalPagesForLogs function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getTotalPagesForLogs } from "TODO";
 *
 * const result = await getTotalPagesForLogs({
 *  startTime: ...,
 *  endTime: ...,
 *  pageSize: ...,
 * });
 *
 * ```
 */
export async function getTotalPagesForLogs(
  options: BaseTransactionOptions<GetTotalPagesForLogsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xde2c2e8b",
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
      "internalType": "uint256",
      "name": "pageSize",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "totalPages",
      "type": "uint256"
    }
  ]
],
    params: [options.startTime, options.endTime, options.pageSize]
  });
};


/**
 * Represents the parameters for the "getUserHotdogLogCount" function.
 */
export type GetUserHotdogLogCountParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "getUserHotdogLogCount" function on the contract.
 * @param options - The options for the getUserHotdogLogCount function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getUserHotdogLogCount } from "TODO";
 *
 * const result = await getUserHotdogLogCount({
 *  user: ...,
 * });
 *
 * ```
 */
export async function getUserHotdogLogCount(
  options: BaseTransactionOptions<GetUserHotdogLogCountParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xcea7de58",
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
      "name": "count",
      "type": "uint256"
    }
  ]
],
    params: [options.user]
  });
};


/**
 * Represents the parameters for the "hasAttested" function.
 */
export type HasAttestedParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
arg_1: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
};

/**
 * Calls the "hasAttested" function on the contract.
 * @param options - The options for the hasAttested function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { hasAttested } from "TODO";
 *
 * const result = await hasAttested({
 *  arg_0: ...,
 *  arg_1: ...,
 * });
 *
 * ```
 */
export async function hasAttested(
  options: BaseTransactionOptions<HasAttestedParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xfe1faae5",
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "",
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
    params: [options.arg_0, options.arg_1]
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
 * Represents the parameters for the "hotdogLogs" function.
 */
export type HotdogLogsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "hotdogLogs" function on the contract.
 * @param options - The options for the hotdogLogs function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { hotdogLogs } from "TODO";
 *
 * const result = await hotdogLogs({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function hotdogLogs(
  options: BaseTransactionOptions<HotdogLogsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xf4f611c9",
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
      "internalType": "string",
      "name": "imageUri",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "metadataUri",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "timestamp",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "eater",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "logger",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "zoraCoin",
      "type": "address"
    }
  ]
],
    params: [options.arg_0]
  });
};




/**
 * Calls the "platformReferrer" function on the contract.
 * @param options - The options for the platformReferrer function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { platformReferrer } from "TODO";
 *
 * const result = await platformReferrer();
 *
 * ```
 */
export async function platformReferrer(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x51845bf6",
  [],
  [
    {
      "internalType": "address",
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
* Contract write functions
*/

/**
 * Represents the parameters for the "addOperator" function.
 */
export type AddOperatorParams = {
  operator: AbiParameterToPrimitiveType<{"internalType":"address","name":"operator","type":"address"}>
};

/**
 * Calls the "addOperator" function on the contract.
 * @param options - The options for the "addOperator" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { addOperator } from "TODO";
 *
 * const transaction = addOperator({
 *  operator: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function addOperator(
  options: BaseTransactionOptions<AddOperatorParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x9870d7fe",
  [
    {
      "internalType": "address",
      "name": "operator",
      "type": "address"
    }
  ],
  []
],
    params: [options.operator]
  });
};


/**
 * Represents the parameters for the "attestHotdogLogOnBehalf" function.
 */
export type AttestHotdogLogOnBehalfParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
attestor: AbiParameterToPrimitiveType<{"internalType":"address","name":"attestor","type":"address"}>
isValid: AbiParameterToPrimitiveType<{"internalType":"bool","name":"isValid","type":"bool"}>
};

/**
 * Calls the "attestHotdogLogOnBehalf" function on the contract.
 * @param options - The options for the "attestHotdogLogOnBehalf" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { attestHotdogLogOnBehalf } from "TODO";
 *
 * const transaction = attestHotdogLogOnBehalf({
 *  logId: ...,
 *  attestor: ...,
 *  isValid: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function attestHotdogLogOnBehalf(
  options: BaseTransactionOptions<AttestHotdogLogOnBehalfParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xb565b9ed",
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
    }
  ],
  []
],
    params: [options.logId, options.attestor, options.isValid]
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
 * Represents the parameters for the "logHotdog" function.
 */
export type LogHotdogParams = {
  imageUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"imageUri","type":"string"}>
metadataUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"metadataUri","type":"string"}>
coinUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"coinUri","type":"string"}>
eater: AbiParameterToPrimitiveType<{"internalType":"address","name":"eater","type":"address"}>
poolConfig: AbiParameterToPrimitiveType<{"internalType":"bytes","name":"poolConfig","type":"bytes"}>
};

/**
 * Calls the "logHotdog" function on the contract.
 * @param options - The options for the "logHotdog" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { logHotdog } from "TODO";
 *
 * const transaction = logHotdog({
 *  imageUri: ...,
 *  metadataUri: ...,
 *  coinUri: ...,
 *  eater: ...,
 *  poolConfig: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function logHotdog(
  options: BaseTransactionOptions<LogHotdogParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xa44252ed",
  [
    {
      "internalType": "string",
      "name": "imageUri",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "metadataUri",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "coinUri",
      "type": "string"
    },
    {
      "internalType": "address",
      "name": "eater",
      "type": "address"
    },
    {
      "internalType": "bytes",
      "name": "poolConfig",
      "type": "bytes"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    }
  ]
],
    params: [options.imageUri, options.metadataUri, options.coinUri, options.eater, options.poolConfig]
  });
};


/**
 * Represents the parameters for the "logHotdogOnBehalf" function.
 */
export type LogHotdogOnBehalfParams = {
  imageUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"imageUri","type":"string"}>
metadataUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"metadataUri","type":"string"}>
coinUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"coinUri","type":"string"}>
eater: AbiParameterToPrimitiveType<{"internalType":"address","name":"eater","type":"address"}>
poolConfig: AbiParameterToPrimitiveType<{"internalType":"bytes","name":"poolConfig","type":"bytes"}>
};

/**
 * Calls the "logHotdogOnBehalf" function on the contract.
 * @param options - The options for the "logHotdogOnBehalf" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { logHotdogOnBehalf } from "TODO";
 *
 * const transaction = logHotdogOnBehalf({
 *  imageUri: ...,
 *  metadataUri: ...,
 *  coinUri: ...,
 *  eater: ...,
 *  poolConfig: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function logHotdogOnBehalf(
  options: BaseTransactionOptions<LogHotdogOnBehalfParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xe7de4e76",
  [
    {
      "internalType": "string",
      "name": "imageUri",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "metadataUri",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "coinUri",
      "type": "string"
    },
    {
      "internalType": "address",
      "name": "eater",
      "type": "address"
    },
    {
      "internalType": "bytes",
      "name": "poolConfig",
      "type": "bytes"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    }
  ]
],
    params: [options.imageUri, options.metadataUri, options.coinUri, options.eater, options.poolConfig]
  });
};


/**
 * Represents the parameters for the "removeOperator" function.
 */
export type RemoveOperatorParams = {
  operator: AbiParameterToPrimitiveType<{"internalType":"address","name":"operator","type":"address"}>
};

/**
 * Calls the "removeOperator" function on the contract.
 * @param options - The options for the "removeOperator" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { removeOperator } from "TODO";
 *
 * const transaction = removeOperator({
 *  operator: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function removeOperator(
  options: BaseTransactionOptions<RemoveOperatorParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xac8a584a",
  [
    {
      "internalType": "address",
      "name": "operator",
      "type": "address"
    }
  ],
  []
],
    params: [options.operator]
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
 * Represents the parameters for the "revokeAttestation" function.
 */
export type RevokeAttestationParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "revokeAttestation" function on the contract.
 * @param options - The options for the "revokeAttestation" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { revokeAttestation } from "TODO";
 *
 * const transaction = revokeAttestation({
 *  logId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function revokeAttestation(
  options: BaseTransactionOptions<RevokeAttestationParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x7fbb1949",
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
 * Represents the parameters for the "revokeAttestationOnBehalf" function.
 */
export type RevokeAttestationOnBehalfParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
attestor: AbiParameterToPrimitiveType<{"internalType":"address","name":"attestor","type":"address"}>
};

/**
 * Calls the "revokeAttestationOnBehalf" function on the contract.
 * @param options - The options for the "revokeAttestationOnBehalf" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { revokeAttestationOnBehalf } from "TODO";
 *
 * const transaction = revokeAttestationOnBehalf({
 *  logId: ...,
 *  attestor: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function revokeAttestationOnBehalf(
  options: BaseTransactionOptions<RevokeAttestationOnBehalfParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x523b75df",
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
    }
  ],
  []
],
    params: [options.logId, options.attestor]
  });
};


/**
 * Represents the parameters for the "revokeHotdogLog" function.
 */
export type RevokeHotdogLogParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
};

/**
 * Calls the "revokeHotdogLog" function on the contract.
 * @param options - The options for the "revokeHotdogLog" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { revokeHotdogLog } from "TODO";
 *
 * const transaction = revokeHotdogLog({
 *  logId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function revokeHotdogLog(
  options: BaseTransactionOptions<RevokeHotdogLogParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x30aa61e8",
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
 * Represents the parameters for the "revokeHotdogLogOnBehalf" function.
 */
export type RevokeHotdogLogOnBehalfParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
owner: AbiParameterToPrimitiveType<{"internalType":"address","name":"owner","type":"address"}>
};

/**
 * Calls the "revokeHotdogLogOnBehalf" function on the contract.
 * @param options - The options for the "revokeHotdogLogOnBehalf" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { revokeHotdogLogOnBehalf } from "TODO";
 *
 * const transaction = revokeHotdogLogOnBehalf({
 *  logId: ...,
 *  owner: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function revokeHotdogLogOnBehalf(
  options: BaseTransactionOptions<RevokeHotdogLogOnBehalfParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xfadb24d3",
  [
    {
      "internalType": "uint256",
      "name": "logId",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "owner",
      "type": "address"
    }
  ],
  []
],
    params: [options.logId, options.owner]
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
 * Represents the parameters for the "setAttestationManager" function.
 */
export type SetAttestationManagerParams = {
  attestationManager: AbiParameterToPrimitiveType<{"internalType":"address","name":"_attestationManager","type":"address"}>
};

/**
 * Calls the "setAttestationManager" function on the contract.
 * @param options - The options for the "setAttestationManager" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setAttestationManager } from "TODO";
 *
 * const transaction = setAttestationManager({
 *  attestationManager: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setAttestationManager(
  options: BaseTransactionOptions<SetAttestationManagerParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x1a32fc88",
  [
    {
      "internalType": "address",
      "name": "_attestationManager",
      "type": "address"
    }
  ],
  []
],
    params: [options.attestationManager]
  });
};


/**
 * Represents the parameters for the "setCoinDeploymentManager" function.
 */
export type SetCoinDeploymentManagerParams = {
  coinDeploymentManager: AbiParameterToPrimitiveType<{"internalType":"address","name":"_coinDeploymentManager","type":"address"}>
};

/**
 * Calls the "setCoinDeploymentManager" function on the contract.
 * @param options - The options for the "setCoinDeploymentManager" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setCoinDeploymentManager } from "TODO";
 *
 * const transaction = setCoinDeploymentManager({
 *  coinDeploymentManager: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setCoinDeploymentManager(
  options: BaseTransactionOptions<SetCoinDeploymentManagerParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x4b65613b",
  [
    {
      "internalType": "address",
      "name": "_coinDeploymentManager",
      "type": "address"
    }
  ],
  []
],
    params: [options.coinDeploymentManager]
  });
};


/**
 * Represents the parameters for the "setPlatformReferrer" function.
 */
export type SetPlatformReferrerParams = {
  platformReferrer: AbiParameterToPrimitiveType<{"internalType":"address","name":"_platformReferrer","type":"address"}>
};

/**
 * Calls the "setPlatformReferrer" function on the contract.
 * @param options - The options for the "setPlatformReferrer" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setPlatformReferrer } from "TODO";
 *
 * const transaction = setPlatformReferrer({
 *  platformReferrer: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setPlatformReferrer(
  options: BaseTransactionOptions<SetPlatformReferrerParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xce6fde0f",
  [
    {
      "internalType": "address",
      "name": "_platformReferrer",
      "type": "address"
    }
  ],
  []
],
    params: [options.platformReferrer]
  });
};



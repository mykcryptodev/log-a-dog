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
    signature: "event HotdogLogged(uint256 indexed logId, address indexed logger, address indexed eater, string imageUri, string metadataUri, uint256 timestamp)",
    filters,
  });
};
  

/**
* Contract read functions
*/

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
 * Represents the parameters for the "getLeaderboard" function.
 */
export type GetLeaderboardParams = {
  startTime: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"startTime","type":"uint256"}>
endTime: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"endTime","type":"uint256"}>
};

/**
 * Calls the "getLeaderboard" function on the contract.
 * @param options - The options for the getLeaderboard function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getLeaderboard } from "TODO";
 * 
 * const result = await getLeaderboard({
 *  startTime: ...,
 *  endTime: ...,
 * });
 * 
 * ```
 */
export async function getLeaderboard(
  options: BaseTransactionOptions<GetLeaderboardParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x73af16fc",
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
    }
  ],
  [
    {
      "internalType": "address[]",
      "name": "users",
      "type": "address[]"
    },
    {
      "internalType": "uint256[]",
      "name": "validLogCounts",
      "type": "uint256[]"
    }
  ]
],
    params: [options.startTime, options.endTime]
  });
};


/**
 * Represents the parameters for the "getTotalPages" function.
 */
export type GetTotalPagesParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
pageSize: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"pageSize","type":"uint256"}>
};

/**
 * Calls the "getTotalPages" function on the contract.
 * @param options - The options for the getTotalPages function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getTotalPages } from "TODO";
 * 
 * const result = await getTotalPages({
 *  user: ...,
 *  pageSize: ...,
 * });
 * 
 * ```
 */
export async function getTotalPages(
  options: BaseTransactionOptions<GetTotalPagesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xd919bb9a",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
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
    params: [options.user, options.pageSize]
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
 * Represents the parameters for the "getUserHotdogLogs" function.
 */
export type GetUserHotdogLogsParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
};

/**
 * Calls the "getUserHotdogLogs" function on the contract.
 * @param options - The options for the getUserHotdogLogs function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getUserHotdogLogs } from "TODO";
 * 
 * const result = await getUserHotdogLogs({
 *  user: ...,
 * });
 * 
 * ```
 */
export async function getUserHotdogLogs(
  options: BaseTransactionOptions<GetUserHotdogLogsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xe84181db",
  [
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
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
    }
  ]
],
    params: [options.user]
  });
};


/**
 * Represents the parameters for the "getUserHotdogLogsPaginated" function.
 */
export type GetUserHotdogLogsPaginatedParams = {
  user: AbiParameterToPrimitiveType<{"internalType":"address","name":"user","type":"address"}>
start: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"start","type":"uint256"}>
limit: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"limit","type":"uint256"}>
};

/**
 * Calls the "getUserHotdogLogsPaginated" function on the contract.
 * @param options - The options for the getUserHotdogLogsPaginated function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getUserHotdogLogsPaginated } from "TODO";
 * 
 * const result = await getUserHotdogLogsPaginated({
 *  user: ...,
 *  start: ...,
 *  limit: ...,
 * });
 * 
 * ```
 */
export async function getUserHotdogLogsPaginated(
  options: BaseTransactionOptions<GetUserHotdogLogsPaginatedParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xc04b830b",
  [
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
    }
  ]
],
    params: [options.user, options.start, options.limit]
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
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
* Contract write functions
*/

/**
 * Represents the parameters for the "attestHotdogLog" function.
 */
export type AttestHotdogLogParams = {
  logId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"logId","type":"uint256"}>
isValid: AbiParameterToPrimitiveType<{"internalType":"bool","name":"isValid","type":"bool"}>
};

/**
 * Calls the "attestHotdogLog" function on the contract.
 * @param options - The options for the "attestHotdogLog" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { attestHotdogLog } from "TODO";
 * 
 * const transaction = attestHotdogLog({
 *  logId: ...,
 *  isValid: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function attestHotdogLog(
  options: BaseTransactionOptions<AttestHotdogLogParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x27f0b444",
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
    }
  ],
  []
],
    params: [options.logId, options.isValid]
  });
};


/**
 * Represents the parameters for the "logHotdog" function.
 */
export type LogHotdogParams = {
  imageUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"imageUri","type":"string"}>
metadataUri: AbiParameterToPrimitiveType<{"internalType":"string","name":"metadataUri","type":"string"}>
eater: AbiParameterToPrimitiveType<{"internalType":"address","name":"eater","type":"address"}>
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
 *  eater: ...,
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
  "0x5d0d5173",
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
      "internalType": "address",
      "name": "eater",
      "type": "address"
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
    params: [options.imageUri, options.metadataUri, options.eater]
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



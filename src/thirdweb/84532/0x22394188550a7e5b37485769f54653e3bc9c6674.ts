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
 * Represents the filters for the "AddressRedacted" event.
 */
export type AddressRedactedEventFilters = Partial<{
  _address: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"_address","type":"address"}>
}>;

/**
 * Creates an event object for the AddressRedacted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { addressRedactedEvent } from "TODO";
 * 
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  addressRedactedEvent({
 *  _address: ...,
 * })
 * ],
 * });
 * ```
 */ 
export function addressRedactedEvent(filters: AddressRedactedEventFilters = {}) {
  return prepareEvent({
    signature: "event AddressRedacted(address indexed _address, bool _redacted)",
    filters,
  });
};
  

/**
 * Represents the filters for the "AttestationRedacted" event.
 */
export type AttestationRedactedEventFilters = Partial<{
  _uid: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"_uid","type":"bytes32"}>
}>;

/**
 * Creates an event object for the AttestationRedacted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { attestationRedactedEvent } from "TODO";
 * 
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  attestationRedactedEvent({
 *  _uid: ...,
 * })
 * ],
 * });
 * ```
 */ 
export function attestationRedactedEvent(filters: AttestationRedactedEventFilters = {}) {
  return prepareEvent({
    signature: "event AttestationRedacted(bytes32 indexed _uid, bool _redacted)",
    filters,
  });
};
  

/**
 * Represents the filters for the "LogRedacted" event.
 */
export type LogRedactedEventFilters = Partial<{
  _logId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"_logId","type":"uint256"}>
}>;

/**
 * Creates an event object for the LogRedacted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { logRedactedEvent } from "TODO";
 * 
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  logRedactedEvent({
 *  _logId: ...,
 * })
 * ],
 * });
 * ```
 */ 
export function logRedactedEvent(filters: LogRedactedEventFilters = {}) {
  return prepareEvent({
    signature: "event LogRedacted(uint256 indexed _logId, bool _redacted)",
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
 * Calls the "LISTER_ROLE" function on the contract.
 * @param options - The options for the LISTER_ROLE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { LISTER_ROLE } from "TODO";
 * 
 * const result = await LISTER_ROLE();
 * 
 * ```
 */
export async function LISTER_ROLE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xdeb26b94",
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
 * Calls the "getRedactedLogIds" function on the contract.
 * @param options - The options for the getRedactedLogIds function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRedactedLogIds } from "TODO";
 * 
 * const result = await getRedactedLogIds();
 * 
 * ```
 */
export async function getRedactedLogIds(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x80d988d3",
  [],
  [
    {
      "internalType": "uint256[]",
      "name": "",
      "type": "uint256[]"
    }
  ]
],
    params: []
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
 * Represents the parameters for the "getRoleMember" function.
 */
export type GetRoleMemberParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
index: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"index","type":"uint256"}>
};

/**
 * Calls the "getRoleMember" function on the contract.
 * @param options - The options for the getRoleMember function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRoleMember } from "TODO";
 * 
 * const result = await getRoleMember({
 *  role: ...,
 *  index: ...,
 * });
 * 
 * ```
 */
export async function getRoleMember(
  options: BaseTransactionOptions<GetRoleMemberParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x9010d07c",
  [
    {
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
    },
    {
      "internalType": "uint256",
      "name": "index",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "address",
      "name": "member",
      "type": "address"
    }
  ]
],
    params: [options.role, options.index]
  });
};


/**
 * Represents the parameters for the "getRoleMemberCount" function.
 */
export type GetRoleMemberCountParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
};

/**
 * Calls the "getRoleMemberCount" function on the contract.
 * @param options - The options for the getRoleMemberCount function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRoleMemberCount } from "TODO";
 * 
 * const result = await getRoleMemberCount({
 *  role: ...,
 * });
 * 
 * ```
 */
export async function getRoleMemberCount(
  options: BaseTransactionOptions<GetRoleMemberCountParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xca15c873",
  [
    {
      "internalType": "bytes32",
      "name": "role",
      "type": "bytes32"
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
 * Represents the parameters for the "hasRoleWithSwitch" function.
 */
export type HasRoleWithSwitchParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
account: AbiParameterToPrimitiveType<{"internalType":"address","name":"account","type":"address"}>
};

/**
 * Calls the "hasRoleWithSwitch" function on the contract.
 * @param options - The options for the hasRoleWithSwitch function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { hasRoleWithSwitch } from "TODO";
 * 
 * const result = await hasRoleWithSwitch({
 *  role: ...,
 *  account: ...,
 * });
 * 
 * ```
 */
export async function hasRoleWithSwitch(
  options: BaseTransactionOptions<HasRoleWithSwitchParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xa32fa5b3",
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
 * Represents the parameters for the "redactedAddresses" function.
 */
export type RedactedAddressesParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
};

/**
 * Calls the "redactedAddresses" function on the contract.
 * @param options - The options for the redactedAddresses function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { redactedAddresses } from "TODO";
 * 
 * const result = await redactedAddresses({
 *  arg_0: ...,
 * });
 * 
 * ```
 */
export async function redactedAddresses(
  options: BaseTransactionOptions<RedactedAddressesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x3c6028ad",
  [
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
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "redactedAttestations" function.
 */
export type RedactedAttestationsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"","type":"bytes32"}>
};

/**
 * Calls the "redactedAttestations" function on the contract.
 * @param options - The options for the redactedAttestations function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { redactedAttestations } from "TODO";
 * 
 * const result = await redactedAttestations({
 *  arg_0: ...,
 * });
 * 
 * ```
 */
export async function redactedAttestations(
  options: BaseTransactionOptions<RedactedAttestationsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xa9f26faa",
  [
    {
      "internalType": "bytes32",
      "name": "",
      "type": "bytes32"
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
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "redactedLogIds" function.
 */
export type RedactedLogIdsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "redactedLogIds" function on the contract.
 * @param options - The options for the redactedLogIds function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { redactedLogIds } from "TODO";
 * 
 * const result = await redactedLogIds({
 *  arg_0: ...,
 * });
 * 
 * ```
 */
export async function redactedLogIds(
  options: BaseTransactionOptions<RedactedLogIdsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xc7f77519",
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
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "redactedLogs" function.
 */
export type RedactedLogsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "redactedLogs" function on the contract.
 * @param options - The options for the redactedLogs function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { redactedLogs } from "TODO";
 * 
 * const result = await redactedLogs({
 *  arg_0: ...,
 * });
 * 
 * ```
 */
export async function redactedLogs(
  options: BaseTransactionOptions<RedactedLogsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x79b2a06b",
  [
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
    params: [options.arg_0]
  });
};


/**
* Contract write functions
*/

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
 * Represents the parameters for the "redactAddress" function.
 */
export type RedactAddressParams = {
  address: AbiParameterToPrimitiveType<{"internalType":"address","name":"_address","type":"address"}>
redacted: AbiParameterToPrimitiveType<{"internalType":"bool","name":"_redacted","type":"bool"}>
};

/**
 * Calls the "redactAddress" function on the contract.
 * @param options - The options for the "redactAddress" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { redactAddress } from "TODO";
 * 
 * const transaction = redactAddress({
 *  address: ...,
 *  redacted: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function redactAddress(
  options: BaseTransactionOptions<RedactAddressParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xd98bf4dd",
  [
    {
      "internalType": "address",
      "name": "_address",
      "type": "address"
    },
    {
      "internalType": "bool",
      "name": "_redacted",
      "type": "bool"
    }
  ],
  []
],
    params: [options.address, options.redacted]
  });
};


/**
 * Represents the parameters for the "redactAttestation" function.
 */
export type RedactAttestationParams = {
  uid: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"_uid","type":"bytes32"}>
redacted: AbiParameterToPrimitiveType<{"internalType":"bool","name":"_redacted","type":"bool"}>
};

/**
 * Calls the "redactAttestation" function on the contract.
 * @param options - The options for the "redactAttestation" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { redactAttestation } from "TODO";
 * 
 * const transaction = redactAttestation({
 *  uid: ...,
 *  redacted: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function redactAttestation(
  options: BaseTransactionOptions<RedactAttestationParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xac7df0d3",
  [
    {
      "internalType": "bytes32",
      "name": "_uid",
      "type": "bytes32"
    },
    {
      "internalType": "bool",
      "name": "_redacted",
      "type": "bool"
    }
  ],
  []
],
    params: [options.uid, options.redacted]
  });
};


/**
 * Represents the parameters for the "redactLog" function.
 */
export type RedactLogParams = {
  id: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"_id","type":"uint256"}>
redacted: AbiParameterToPrimitiveType<{"internalType":"bool","name":"_redacted","type":"bool"}>
};

/**
 * Calls the "redactLog" function on the contract.
 * @param options - The options for the "redactLog" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { redactLog } from "TODO";
 * 
 * const transaction = redactLog({
 *  id: ...,
 *  redacted: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function redactLog(
  options: BaseTransactionOptions<RedactLogParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x556cf9b9",
  [
    {
      "internalType": "uint256",
      "name": "_id",
      "type": "uint256"
    },
    {
      "internalType": "bool",
      "name": "_redacted",
      "type": "bool"
    }
  ],
  []
],
    params: [options.id, options.redacted]
  });
};


/**
 * Represents the parameters for the "renounceRole" function.
 */
export type RenounceRoleParams = {
  role: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"role","type":"bytes32"}>
account: AbiParameterToPrimitiveType<{"internalType":"address","name":"account","type":"address"}>
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
 *  account: ...,
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



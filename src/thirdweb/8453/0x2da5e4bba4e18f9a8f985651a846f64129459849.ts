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
 * Represents the filters for the "ProfileSet" event.
 */
export type ProfileSetEventFilters = Partial<{
  _address: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"_address","type":"address"}>
}>;

/**
 * Creates an event object for the ProfileSet event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { profileSetEvent } from "TODO";
 * 
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  profileSetEvent({
 *  _address: ...,
 * })
 * ],
 * });
 * ```
 */ 
export function profileSetEvent(filters: ProfileSetEventFilters = {}) {
  return prepareEvent({
    signature: "event ProfileSet(address indexed _address, string _username, string _image, string _metadata)",
    filters,
  });
};
  

/**
* Contract read functions
*/

/**
 * Represents the parameters for the "canSetProfile" function.
 */
export type CanSetProfileParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
};

/**
 * Calls the "canSetProfile" function on the contract.
 * @param options - The options for the canSetProfile function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { canSetProfile } from "TODO";
 * 
 * const result = await canSetProfile({
 *  arg_0: ...,
 * });
 * 
 * ```
 */
export async function canSetProfile(
  options: BaseTransactionOptions<CanSetProfileParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xed12c0fe",
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
 * Represents the parameters for the "isValidUsername" function.
 */
export type IsValidUsernameParams = {
  username: AbiParameterToPrimitiveType<{"internalType":"string","name":"username","type":"string"}>
};

/**
 * Calls the "isValidUsername" function on the contract.
 * @param options - The options for the isValidUsername function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { isValidUsername } from "TODO";
 * 
 * const result = await isValidUsername({
 *  username: ...,
 * });
 * 
 * ```
 */
export async function isValidUsername(
  options: BaseTransactionOptions<IsValidUsernameParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x3b032005",
  [
    {
      "internalType": "string",
      "name": "username",
      "type": "string"
    }
  ],
  [
    {
      "internalType": "bool",
      "name": "isValid",
      "type": "bool"
    },
    {
      "internalType": "string",
      "name": "validUsername",
      "type": "string"
    }
  ]
],
    params: [options.username]
  });
};




/**
 * Calls the "owner" function on the contract.
 * @param options - The options for the owner function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { owner } from "TODO";
 * 
 * const result = await owner();
 * 
 * ```
 */
export async function owner(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x8da5cb5b",
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
 * Represents the parameters for the "profiles" function.
 */
export type ProfilesParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
};

/**
 * Calls the "profiles" function on the contract.
 * @param options - The options for the profiles function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { profiles } from "TODO";
 * 
 * const result = await profiles({
 *  arg_0: ...,
 * });
 * 
 * ```
 */
export async function profiles(
  options: BaseTransactionOptions<ProfilesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xbbe15627",
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "string",
      "name": "username",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "image",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "metadata",
      "type": "string"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "usedUsernames" function.
 */
export type UsedUsernamesParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"string","name":"","type":"string"}>
};

/**
 * Calls the "usedUsernames" function on the contract.
 * @param options - The options for the usedUsernames function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { usedUsernames } from "TODO";
 * 
 * const result = await usedUsernames({
 *  arg_0: ...,
 * });
 * 
 * ```
 */
export async function usedUsernames(
  options: BaseTransactionOptions<UsedUsernamesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xf3e33994",
  [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  [
    {
      "internalType": "address",
      "name": "",
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
 * Represents the parameters for the "setCanSetProfile" function.
 */
export type SetCanSetProfileParams = {
  address: AbiParameterToPrimitiveType<{"internalType":"address","name":"_address","type":"address"}>
canSetProfile: AbiParameterToPrimitiveType<{"internalType":"bool","name":"_canSetProfile","type":"bool"}>
};

/**
 * Calls the "setCanSetProfile" function on the contract.
 * @param options - The options for the "setCanSetProfile" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setCanSetProfile } from "TODO";
 * 
 * const transaction = setCanSetProfile({
 *  address: ...,
 *  canSetProfile: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function setCanSetProfile(
  options: BaseTransactionOptions<SetCanSetProfileParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x6212dee4",
  [
    {
      "internalType": "address",
      "name": "_address",
      "type": "address"
    },
    {
      "internalType": "bool",
      "name": "_canSetProfile",
      "type": "bool"
    }
  ],
  []
],
    params: [options.address, options.canSetProfile]
  });
};


/**
 * Represents the parameters for the "setProfile" function.
 */
export type SetProfileParams = {
  username: AbiParameterToPrimitiveType<{"internalType":"string","name":"_username","type":"string"}>
image: AbiParameterToPrimitiveType<{"internalType":"string","name":"_image","type":"string"}>
metadata: AbiParameterToPrimitiveType<{"internalType":"string","name":"_metadata","type":"string"}>
};

/**
 * Calls the "setProfile" function on the contract.
 * @param options - The options for the "setProfile" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setProfile } from "TODO";
 * 
 * const transaction = setProfile({
 *  username: ...,
 *  image: ...,
 *  metadata: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function setProfile(
  options: BaseTransactionOptions<SetProfileParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x52640314",
  [
    {
      "internalType": "string",
      "name": "_username",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "_image",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "_metadata",
      "type": "string"
    }
  ],
  []
],
    params: [options.username, options.image, options.metadata]
  });
};


/**
 * Represents the parameters for the "setProfileOnBehalf" function.
 */
export type SetProfileOnBehalfParams = {
  address: AbiParameterToPrimitiveType<{"internalType":"address","name":"_address","type":"address"}>
username: AbiParameterToPrimitiveType<{"internalType":"string","name":"_username","type":"string"}>
image: AbiParameterToPrimitiveType<{"internalType":"string","name":"_image","type":"string"}>
metadata: AbiParameterToPrimitiveType<{"internalType":"string","name":"_metadata","type":"string"}>
};

/**
 * Calls the "setProfileOnBehalf" function on the contract.
 * @param options - The options for the "setProfileOnBehalf" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setProfileOnBehalf } from "TODO";
 * 
 * const transaction = setProfileOnBehalf({
 *  address: ...,
 *  username: ...,
 *  image: ...,
 *  metadata: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function setProfileOnBehalf(
  options: BaseTransactionOptions<SetProfileOnBehalfParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xd2237893",
  [
    {
      "internalType": "address",
      "name": "_address",
      "type": "address"
    },
    {
      "internalType": "string",
      "name": "_username",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "_image",
      "type": "string"
    },
    {
      "internalType": "string",
      "name": "_metadata",
      "type": "string"
    }
  ],
  []
],
    params: [options.address, options.username, options.image, options.metadata]
  });
};


/**
 * Represents the parameters for the "transferOwnership" function.
 */
export type TransferOwnershipParams = {
  newOwner: AbiParameterToPrimitiveType<{"internalType":"address","name":"_newOwner","type":"address"}>
};

/**
 * Calls the "transferOwnership" function on the contract.
 * @param options - The options for the "transferOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { transferOwnership } from "TODO";
 * 
 * const transaction = transferOwnership({
 *  newOwner: ...,
 * });
 * 
 * // Send the transaction
 * ...
 * 
 * ```
 */
export function transferOwnership(
  options: BaseTransactionOptions<TransferOwnershipParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xf2fde38b",
  [
    {
      "internalType": "address",
      "name": "_newOwner",
      "type": "address"
    }
  ],
  []
],
    params: [options.newOwner]
  });
};



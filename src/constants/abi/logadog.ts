export const abi = [
{
    "inputs": [
    {
        "internalType": "address",
        "name": "_platformReferrer",
        "type": "address"
    },
    {
        "internalType": "address",
        "name": "_attestationManager",
        "type": "address"
    },
    {
        "internalType": "address",
        "name": "_coinDeploymentManager",
        "type": "address"
    }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
},
{
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
},
{
    "inputs": [
    {
        "internalType": "address",
        "name": "account",
        "type": "address"
    },
    {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
    }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "attestor",
        "type": "address"
    },
    {
        "indexed": false,
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
    }
    ],
    "name": "AttestationMade",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "attestor",
        "type": "address"
    }
    ],
    "name": "AttestationRevoked",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "eater",
        "type": "address"
    },
    {
        "indexed": false,
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
    },
    {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
    }
    ],
    "name": "DogValidityUpdated",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "logger",
        "type": "address"
    }
    ],
    "name": "HotdogLogRevoked",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "logger",
        "type": "address"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "eater",
        "type": "address"
    },
    {
        "indexed": false,
        "internalType": "string",
        "name": "imageUri",
        "type": "string"
    },
    {
        "indexed": false,
        "internalType": "string",
        "name": "metadataUri",
        "type": "string"
    },
    {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
    },
    {
        "indexed": false,
        "internalType": "address",
        "name": "zoraCoin",
        "type": "address"
    }
    ],
    "name": "HotdogLogged",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
    }
    ],
    "name": "OperatorAdded",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
    }
    ],
    "name": "OperatorRemoved",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
    },
    {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
    },
    {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
    }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
    }
    ],
    "name": "RoleGranted",
    "type": "event"
},
{
    "anonymous": false,
    "inputs": [
    {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
    },
    {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
    }
    ],
    "name": "RoleRevoked",
    "type": "event"
},
{
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
    {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [],
    "name": "OPERATOR_ROLE",
    "outputs": [
    {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "address",
        "name": "operator",
        "type": "address"
    }
    ],
    "name": "addOperator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
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
    "name": "attestHotdogLog",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
},
{
    "inputs": [
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
    "name": "attestHotdogLogOnBehalf",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [],
    "name": "attestationManager",
    "outputs": [
    {
        "internalType": "contract AttestationManager",
        "name": "",
        "type": "address"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
    "name": "attestations",
    "outputs": [
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
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [],
    "name": "coinDeploymentManager",
    "outputs": [
    {
        "internalType": "contract CoinDeploymentManager",
        "name": "",
        "type": "address"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "name": "emitValidityUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "name": "getAttestationCount",
    "outputs": [
    {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
        "name": "offset",
        "type": "uint256"
    },
    {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
    }
    ],
    "name": "getDogsInTimeRange",
    "outputs": [
    {
        "internalType": "uint256[]",
        "name": "logIds",
        "type": "uint256[]"
    },
    {
        "internalType": "address[]",
        "name": "eaters",
        "type": "address[]"
    },
    {
        "internalType": "uint256[]",
        "name": "timestamps",
        "type": "uint256[]"
    },
    {
        "internalType": "bool[]",
        "name": "hasAttestationEnded",
        "type": "bool[]"
    },
    {
        "internalType": "bool[]",
        "name": "isValid",
        "type": "bool[]"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "name": "getHotdogLog",
    "outputs": [
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
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
    "name": "getHotdogLogs",
    "outputs": [
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
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [],
    "name": "getHotdogLogsCount",
    "outputs": [
    {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
    "name": "getHotdogLogsRange",
    "outputs": [
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
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
    }
    ],
    "name": "getRoleAdmin",
    "outputs": [
    {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
    "name": "getTotalPagesForLogs",
    "outputs": [
    {
        "internalType": "uint256",
        "name": "totalPages",
        "type": "uint256"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "address",
        "name": "user",
        "type": "address"
    }
    ],
    "name": "getUserHotdogLogCount",
    "outputs": [
    {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
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
    "name": "hasAttested",
    "outputs": [
    {
        "internalType": "bool",
        "name": "",
        "type": "bool"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
    "name": "hasRole",
    "outputs": [
    {
        "internalType": "bool",
        "name": "",
        "type": "bool"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
    }
    ],
    "name": "hotdogLogs",
    "outputs": [
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
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
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
    "name": "logHotdog",
    "outputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "stateMutability": "payable",
    "type": "function"
},
{
    "inputs": [
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
    "name": "logHotdogOnBehalf",
    "outputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "stateMutability": "payable",
    "type": "function"
},
{
    "inputs": [],
    "name": "platformReferrer",
    "outputs": [
    {
        "internalType": "address",
        "name": "",
        "type": "address"
    }
    ],
    "stateMutability": "view",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "address",
        "name": "operator",
        "type": "address"
    }
    ],
    "name": "removeOperator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
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
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "name": "resolveAttestationPeriod",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "name": "revokeAttestation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
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
    "name": "revokeAttestationOnBehalf",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "uint256",
        "name": "logId",
        "type": "uint256"
    }
    ],
    "name": "revokeHotdogLog",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
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
    "name": "revokeHotdogLogOnBehalf",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
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
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "address",
        "name": "_attestationManager",
        "type": "address"
    }
    ],
    "name": "setAttestationManager",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "address",
        "name": "_coinDeploymentManager",
        "type": "address"
    }
    ],
    "name": "setCoinDeploymentManager",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "address",
        "name": "_platformReferrer",
        "type": "address"
    }
    ],
    "name": "setPlatformReferrer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
{
    "inputs": [
    {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
    }
    ],
    "name": "supportsInterface",
    "outputs": [
    {
        "internalType": "bool",
        "name": "",
        "type": "bool"
    }
    ],
    "stateMutability": "view",
    "type": "function"
}
] as const;
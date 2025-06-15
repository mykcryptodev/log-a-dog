# Dog Events Webhook Documentation

## Overview

This application receives and stores dog event data from blockchain webhooks. The system is designed to handle duplicate events gracefully and provides APIs to query the stored data.

## Webhook Endpoint

### POST `/api/webhook/dog-events`

Receives dog event data from the blockchain webhook service.

**Endpoint URL**: `https://your-domain.com/api/webhook/dog-events`

**Method**: POST

**Content-Type**: `application/json`

**Request Body Example**:
```json
{
    "data": [
        {
            "data": {
                "chain_id": "84532",
                "block_number": 27120830,
                "block_hash": "0x49adab2ee2807464bdb3431f2a35c5628708f80d8869ad7a9d427c8388f0edfc",
                "block_timestamp": 1750009948,
                "transaction_hash": "0x9a2483e0f88326259735a47709ec4b4ea3ddeda926727d68aa1a0fcffe06ba0a",
                "transaction_index": 20,
                "log_index": 312,
                "address": "0x7bc35e42781d2581009042777e8efde2217a794e",
                "data": "0x000000...",
                "topics": ["0x0d4cd2468ea6d0f2bf4dd33a6419382b5e4dcb8d6ffcc581703619157d2b1ccc", ...],
                "decoded": {
                    "name": "HotdogLogged",
                    "indexed_params": {
                        "eater": "0x96dbfa4cee8665a7b249c6f8677dd43c90dd92ed",
                        "logId": "2",
                        "logger": "0x360e36befcc2db9c45e411e5e4840fe33a8f21b0"
                    },
                    "non_indexed_params": {
                        "imageUri": "ipfs://QmYLQxtCdWm59EVmC5xy2z4r3MjTN3fhevEWxW78h16ovJ/image.png",
                        "metadataUri": "",
                        "timestamp": "1750009948",
                        "zoraCoin": "0x7045d5548111e0f0d07a0af57d0029be228ab870"
                    }
                }
            },
            "status": "new",
            "type": "event",
            "id": "ff10756c2e3973e58f41cd33bdd02520e09c9f637b0f2722c5fe5b8eb7a203bc"
        }
    ],
    "timestamp": 1750009960,
    "topic": "v1.events"
}
```

**Response**:
- **200 OK**: Events processed successfully
  ```json
  {
    "success": true,
    "message": "Processed 1 events successfully, 0 failed",
    "results": [
      {
        "success": true,
        "id": "clxyz123...",
        "transactionHash": "0x9a2483e0..."
      }
    ]
  }
  ```
- **400 Bad Request**: Invalid payload format
- **500 Internal Server Error**: Server error

### Duplicate Prevention

The system prevents duplicate events by using unique constraints on:
- `transactionHash`: Ensures each blockchain transaction is only stored once
- `webhookId`: Prevents duplicate webhook deliveries

If a duplicate event is received, the system will:
1. Update the webhook metadata (status, timestamp)
2. Return a success response indicating the duplicate was handled

## Query API

### GET `/api/dog-events`

Query stored dog events with filtering and pagination.

**Query Parameters**:
- `logger` (optional): Filter by logger address
- `eater` (optional): Filter by eater address
- `attestationStatus` (optional): Filter by attestation status ("valid", "invalid", or "pending")
- `take` (optional): Number of records to return (default: 20)
- `skip` (optional): Number of records to skip for pagination (default: 0)
- `stats` (optional): Set to "true" to get statistics instead of events

**Examples**:

1. Get latest 20 events:
   ```
   GET /api/dog-events
   ```

2. Get events for a specific logger:
   ```
   GET /api/dog-events?logger=0x360e36befcc2db9c45e411e5e4840fe33a8f21b0
   ```

3. Get only valid dog events:
   ```
   GET /api/dog-events?attestationStatus=valid
   ```

4. Get pending attestations:
   ```
   GET /api/dog-events?attestationStatus=pending
   ```

5. Get events with pagination:
   ```
   GET /api/dog-events?take=10&skip=20
   ```

6. Get statistics:
   ```
   GET /api/dog-events?stats=true
   ```

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz123...",
      "chainId": "84532",
      "transactionHash": "0x9a2483e0...",
      "address": "0x7bc35e42781d2581009042777e8efde2217a794e",
      "blockTimestamp": "1750009948",
      "logId": "2",
      "logger": "0x360e36befcc2db9c45e411e5e4840fe33a8f21b0",
      "eater": "0x96dbfa4cee8665a7b249c6f8677dd43c90dd92ed",
      "imageUri": "ipfs://QmYLQxtCdWm59EVmC5xy2z4r3MjTN3fhevEWxW78h16ovJ/image.png",
      "metadataUri": "",
      "timestamp": "1750009948",
      "zoraCoin": "0x7045d5548111e0f0d07a0af57d0029be228ab870",
      "webhookId": "ff10756c2e3973e58f41cd33bdd02520e09c9f637b0f2722c5fe5b8eb7a203bc",
      "attestationResolved": false,
      "attestationValid": null,
      "attestationTotalValidStake": null,
      "attestationTotalInvalidStake": null,
      "attestationResolvedAt": null,
      "attestationTransactionHash": null,
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "take": 20,
    "skip": 0
  }
}
```

## Database Schema

The `DogEvent` table stores:
- Essential blockchain data (chain ID, transaction hash, address, block timestamp)
- Decoded event data (logId, logger, eater, image URI, timestamp, zoraCoin)
- Webhook ID for deduplication
- Attestation data (resolved status, validity, stake amounts)
- Timestamps (created at, updated at)

## Setup Instructions

1. Run database migrations:
   ```bash
   npx prisma db push
   ```

2. Configure your webhook service to send events to:
   ```
   https://your-domain.com/api/webhook/dog-events
   ```

3. The endpoint will automatically:
   - Validate incoming data
   - Store events in the database
   - Handle duplicates gracefully
   - Return appropriate responses

## Attestation Resolution Webhook

### POST `/api/webhook/attestation-resolved`

Receives attestation resolution events to update the validity status of logged dogs.

**Endpoint URL**: `https://your-domain.com/api/webhook/attestation-resolved`

**Method**: POST

**Content-Type**: `application/json`

**Request Body Example**:
```json
{
    "data": [
        {
            "data": {
                "chain_id": "84532",
                "block_number": 27121613,
                "block_hash": "0xa27404ce33335a5bcdecd8308314eae925522dffa15c3e96631053cdc394ebea",
                "block_timestamp": 1750011514,
                "transaction_hash": "0xaca539b0e4d026212583b9450b70772bc3e9e59b01f72e7b099fd10720546016",
                "transaction_index": 20,
                "log_index": 230,
                "address": "0xd520724dc4d977b154f34e0aab7fb6f0a59e6a8e",
                "data": "0x00000000...",
                "topics": ["0x14afdaf027ee85f05bdbedf3b7a9bb573c93df69703e19946e0345900c5293ac", ...],
                "decoded": {
                    "name": "AttestationPeriodResolved",
                    "indexed_params": {
                        "logId": "7"
                    },
                    "non_indexed_params": {
                        "isValid": true,
                        "totalInvalidStake": "0",
                        "totalValidStake": "100000000000000000000"
                    }
                }
            },
            "status": "new",
            "type": "event",
            "id": "847a5cb6202a8eb5e022a83334eb641ede42b15c05a7a7bdc7c054296495389a"
        }
    ],
    "timestamp": 1750011535,
    "topic": "v1.events"
}
```

**Response**:
- **200 OK**: Attestations processed successfully
  ```json
  {
    "success": true,
    "message": "Processed 1 attestations successfully, 0 failed, 0 skipped",
    "results": [
      {
        "success": true,
        "id": "clxyz123...",
        "logId": "7",
        "isValid": true,
        "transactionHash": "0xaca539b0..."
      }
    ]
  }
  ```

### How Attestation Works

1. When a dog is logged, it gets a unique `logId`
2. Later, an attestation period resolves to determine if the logged dog is valid
3. The attestation webhook updates the original dog event with:
   - `attestationValid`: Whether the dog log was deemed valid
   - `attestationTotalValidStake`: Total stake voting for validity
   - `attestationTotalInvalidStake`: Total stake voting against validity
   - `attestationResolvedAt`: When the attestation was resolved
   - `attestationTransactionHash`: Transaction hash of the attestation resolution

## Error Handling

The webhook endpoints include comprehensive error handling:
- Validates payload structure using Zod schemas
- Handles database errors gracefully
- Logs errors for debugging
- Returns appropriate HTTP status codes
- Processes events in parallel for efficiency 
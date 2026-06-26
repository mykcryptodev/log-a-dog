# x402 AI Analysis Endpoint

`POST /api/x402/analyze` — a pay-per-call [x402](https://www.x402.org/) endpoint that
runs an AI moderation pass on a single dog log, votes on-chain, and rewards the
caller in `$HOTDOG`.

## What it does

1. The caller sends a `logId` to analyze.
2. If that log has **already been analyzed** (the AI judge has voted) or is
   **locked** (an analysis is already in flight), the request is rejected with
   `409` **before** any payment is taken.
3. Otherwise the log is locked so no other request can analyze it concurrently.
4. The endpoint pays for vision inference on the fly via x402 ("Surplus
   Intelligence", OpenAI-compatible) out of the backend's USDC ("surplus") balance.
5. The model is asked whether the image shows someone **eating or displaying a
   hotdog**.
6. The AI judge casts an on-chain attestation: **VALID** if the model says yes,
   **SUS** if it says no.
7. The caller is reimbursed **2× the USDC they spent**, paid in `$HOTDOG` from the
   reserve wallet at the current Zora market price.

Network: **Base mainnet (8453)** only.

## Request

```
POST /api/x402/analyze
Content-Type: application/json

{ "logId": "1234" }
```

The caller is expected to drive this with an x402 client so the payment handshake
is automatic, e.g. with thirdweb:

```ts
import { wrapFetchWithPayment } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { createWalletAdapter, privateKeyToAccount } from "thirdweb/wallets";
import { base } from "thirdweb/chains";

const client = createThirdwebClient({ clientId: "..." });
const account = privateKeyToAccount({ client, privateKey: "0x..." });
const wallet = createWalletAdapter({
  client, adaptedAccount: account, chain: base,
  onDisconnect: () => {}, switchChain: () => {},
});

const fetchWithPay = wrapFetchWithPayment(fetch, client, wallet);
const res = await fetchWithPay("https://<host>/api/x402/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ logId: "1234" }),
});
const result = await res.json();
```

The first request returns `402 Payment Required` with the payment requirements
(price = `$0.01` in USDC on Base). The x402 client signs an authorization and
retries; only then is the work performed.

## Response

```json
{
  "logId": "1234",
  "verdict": "VALID",
  "isValidHotdog": true,
  "payer": "0x...",
  "usdcSpent": "10000",
  "hotdogReward": "123456789012345678",
  "hotdogPriceUsd": 0.000162,
  "voteTransactionId": "...",
  "payoutTransactionId": "..."
}
```

| Status | Meaning |
| ------ | ------- |
| `200`  | Analyzed, voted, paid out. |
| `402`  | Payment required / insufficient (x402 handshake). |
| `409`  | Already analyzed, or an analysis is in progress — **no payment taken**. |
| `404`  | Log not found on-chain. |
| `503`  | AI judge can't currently vote (insufficient stake). **No payment taken.** |
| `502`  | Inference or downstream step failed. |

## Payment safety

The payment is only **settled** (funds pulled) *after* the on-chain vote has been
enqueued. Up to that point only a signed authorization exists, so the cancel paths
(`409`, `503`, `404`) never move the caller's money. Settlement uses thirdweb's
`verifyPayment` → work → `settlePayment` pattern.

## Configuration

No new environment variables are required. The endpoint reuses:

- `ADMIN_PRIVATE_KEY` — signs the x402 payment for **inference** (the "surplus"
  spend). This wallet must hold a small USDC balance on Base.
- `NEXT_PUBLIC_THIRDWEB_SERVER_WALLET_ADDRESS` + `THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN`
  — the server wallet acts as the **AI judge** (casts the vote), the **reserve**
  (holds `$HOTDOG` and pays it out), and the x402 **facilitator / `payTo`** (receives
  the caller's USDC).

Tunable constants live in `src/constants/index.ts`:

- `X402_ANALYSIS_PRICE_USD` (default `"$0.01"`)
- `X402_PAYOUT_MULTIPLIER` (default `2n`)
- `SURPLUS_INFERENCE_URL`, `SURPLUS_MODEL` (vision-capable model id)
- `X402_INFERENCE_MAX_USDC` (per-call inference spend cap)

### Operational requirements

For the endpoint to function end-to-end the server wallet must:

1. Hold `OPERATOR_ROLE` on `LogADog` (already configured).
2. Have at least `MINIMUM_ATTESTATION_STAKE` staked so it can attest as the AI judge.
3. Hold a `$HOTDOG` reserve large enough to cover `2×` payouts.

And `ADMIN_PRIVATE_KEY`'s wallet must hold USDC on Base to pay for inference.

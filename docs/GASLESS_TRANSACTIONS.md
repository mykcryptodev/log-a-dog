# Gasless transactions

Logging a dog must never require the user to hold ETH. This document describes
how that works, why it broke, and what you need to configure.

## Background: why this needed fixing

Every write used to be relayed by the thirdweb hosted Engine server wallet
(`serverWallet.enqueueTransaction`). Its vault access token was invalidated by an
issuer-account rotation, so those transactions stopped landing and logging was
moved into the user's own wallet.

That client-side path had a paymaster branch, but it never ran. thirdweb's
`getCapabilities` normalises the EIP-5792 response with `Number(chainId)`, so the
result is keyed by the **decimal** chain id (`8453`). The code looked it up by
the **hex** id (`DEFAULT_CHAIN.id.toString(16)` → `"2105"`), which never matched,
so every wallet — including Coinbase Smart Wallet and the Base App — silently
fell through to a user-paid `sendTransaction`. And a plain EOA had no sponsorship
route at all.

## The three rails

`src/utils/gasless.ts` resolves one rail per wallet per chain
(`getSponsorshipRail`) and sends on it (`sendSponsoredTransaction`):

| Rail | Wallets | How it sends |
| --- | --- | --- |
| `wallet` | thirdweb in-app wallets (EIP-7702 with `sponsorGas: true`) and smart wallets | plain `sendTransaction`; the account's own bundler pays |
| `paymaster` | external EIP-5792 wallets advertising `paymasterService` (Coinbase Smart Wallet, Base App) | `sendAndConfirmCalls` with the thirdweb paymaster URL |
| `none` | plain EOAs — MetaMask, Rainbow, most WalletConnect wallets | nothing client-side is possible; see the relay below |

A wallet is only treated as sponsored when it actually reports
`paymasterService.supported === true` for the chain. thirdweb's own accounts
report `false` when `sponsorGas` is off, so a mis-configured in-app wallet
degrades to the relay instead of failing with "insufficient funds for gas".

Do **not** pass a paymaster URL to a thirdweb in-app or smart wallet: their
sponsorship is internal, and specifying our own on top is redundant at best.

## The relay (plain EOAs)

`hotdog.logGasless` relays the log for wallets on the `none` rail:

1. `protectedProcedure` — the caller must have a next-auth (SIWE) session.
2. `eater` is taken from the session, never from the request body, so a relayed
   log cannot be attributed to somebody else.
3. The sponsor EOA calls `logHotdogOnBehalf` on `LogADog`, paying the gas. The
   Zora coin is still deployed for `eater`, so coin ownership is unaffected.
4. The mutation returns as soon as the transaction is broadcast; the client
   waits for the receipt. That split matters: a thrown error from the mutation
   means nothing landed on-chain and it is safe to retry with a user-paid
   transaction, whereas a failure *after* a hash exists must surface as an error
   rather than a retry — retrying would log the dog and mint its coin twice.

Guards in `src/server/utils/sponsor.ts`:

- **Operator preflight** — `logHotdogOnBehalf` is `operatorOnly`, so the sponsor's
  `OPERATOR_ROLE` is checked (and cached in Redis) before spending gas on a
  guaranteed revert.
- **Rate limits** — 30s cooldown per address, 25 sponsored logs per address per
  day, 750 globally per day. Exceeding them just means the user pays their own
  gas.
- **Nonce lock** — a short Redis lock serialises sponsor sends, since thirdweb
  reads the pending nonce immediately before signing and two concurrent relays
  would otherwise sign the same one.

Voting (`attestToLog`) is **not** relayed: the stake has to come from the voter's
own balance, so `attestToLogOnBehalf` would not do what the name suggests here.
Votes are sponsored on the `wallet` and `paymaster` rails only.

## Setup

1. Create an EOA for sponsorship and fund it with Base ETH. (Each log deploys a
   Zora coin, so budget accordingly — the daily caps above bound the spend.)
2. Grant it `OPERATOR_ROLE` on `LogADog` from an account holding
   `DEFAULT_ADMIN_ROLE`:

   ```
   cast send $LOG_A_DOG "addOperator(address)" $SPONSOR_ADDRESS \
     --rpc-url https://mainnet.base.org --private-key $ADMIN_PRIVATE_KEY
   ```

3. Set the environment variables:

   | Variable | Purpose |
   | --- | --- |
   | `LOGADOG_SPONSOR_PK` | sponsor private key (server-only). Falls back to `LOGADOG_KEEPER_PK` if unset — that key only works if it *also* holds `OPERATOR_ROLE`. |
   | `NEXT_PUBLIC_LOGADOG_SPONSOR_ADDRESS` | the matching address. Cosmetic only: lets the feed hide the "via &lt;relayer&gt;" byline on relayed logs. |

Until this is configured, `hotdog.getGaslessLoggingStatus` reports
`available: false`, the log modal tells EOA users they'll pay a small gas fee,
and everything else keeps working. In-app and EIP-5792 smart wallets stay gasless
regardless — they need no server-side configuration.

## Verifying

- **In-app wallet (Google/email login)**: log a dog with an account holding zero
  ETH. It should succeed with no gas prompt.
- **Base App / Coinbase Smart Wallet**: the modal should read "Gas is on us" and
  the transaction should confirm without a fee.
- **MetaMask with zero ETH**: the modal should read "Gas is on us" once the
  sponsor is configured, and the resulting log should show the user as `eater`
  with the sponsor as `logger` (no "via" byline in the feed).
- **"Pay my own gas fees"** in Advanced options still routes through the normal
  user-paid `TransactionButton`.

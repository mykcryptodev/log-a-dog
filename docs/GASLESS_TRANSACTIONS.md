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

## Every log is relayed

Logging does **not** branch on wallet type. Every log goes through the
`hotdog.logGasless` relay, so the guarantee doesn't depend on which wallet
somebody happens to connect: one code path, one funding source, no exposure to
per-wallet EIP-5792 quirks or thirdweb paymaster billing.

Two costs come with that, both accepted deliberately:

- The sponsor EOA is the `logger` on-chain for every dog. `eater` is still the
  user, so leaderboards, profiles and Zora coin ownership are unaffected, and
  the feed hides the "via" byline for the sponsor address.
- You pay gas for in-app and smart-wallet logs that thirdweb's bundler would
  otherwise have covered for free. On Base that's roughly 0.00001 ETH per log.

## The fallback rails

`src/utils/gasless.ts` still resolves the wallet's own rail
(`getSponsorshipRail`) and sends on it (`sendSponsoredTransaction`) whenever the
relay can't take the log — unconfigured, out of gas, or at a daily cap:

| Rail | Wallets | How it sends |
| --- | --- | --- |
| `wallet` | thirdweb in-app wallets (EIP-7702 with `sponsorGas: true`) and smart wallets | plain `sendTransaction`; the account's own bundler pays |
| `paymaster` | external EIP-5792 wallets advertising `paymasterService` (Coinbase Smart Wallet, Base App) | `sendAndConfirmCalls` with the thirdweb paymaster URL |
| `none` | plain EOAs — MetaMask, Rainbow, most WalletConnect wallets | the user pays, and the modal says so before they commit |

A wallet is only treated as sponsored when it actually reports
`paymasterService.supported === true` for the chain. thirdweb's own accounts
report `false` when `sponsorGas` is off, so a mis-configured in-app wallet
degrades honestly instead of failing with "insufficient funds for gas".

Do **not** pass a paymaster URL to a thirdweb in-app or smart wallet: their
sponsorship is internal, and specifying our own on top is redundant at best.

Degrading to the wallet is free when it sponsors itself, so that happens
quietly. Degrading to a plain EOA charges someone who was just told the log was
on us, so it is announced — and a *rate-limited* relay never degrades that way,
since asking the user to wait a moment costs them nothing.

## The relay

`hotdog.logGasless`:

1. `protectedProcedure` — the caller must have a next-auth (SIWE) session.
2. `eater` is taken from the session, never from the request body, so a relayed
   log cannot be attributed to somebody else.
3. The sponsor EOA calls `logHotdogOnBehalf` on `LogADog`, paying the gas. The
   Zora coin is still deployed for `eater`, so coin ownership is unaffected.
4. The mutation returns as soon as the transaction is broadcast; the client
   waits for the receipt. That split matters: a thrown error from the mutation
   means nothing landed on-chain and it is safe to fall back to the wallet,
   whereas a failure *after* a hash exists must surface as an error rather than
   a retry — retrying would log the dog and mint its coin twice.

Guards in `src/server/utils/sponsor.ts`:

- **Operator preflight** — `logHotdogOnBehalf` is `operatorOnly`, so the sponsor's
  `OPERATOR_ROLE` is checked (and cached in Redis) before spending gas on a
  guaranteed revert.
- **Rate limits** — 30s cooldown per address, 25 sponsored logs per address per
  day, 2000 globally per day. The global figure is the real daily spend cap now
  that all traffic is relayed; at ~0.00001 ETH a log that's about 0.02 ETH.
- **Nonce lock** — a short Redis lock serialises sponsor sends, since thirdweb
  reads the pending nonce immediately before signing and two concurrent relays
  would otherwise sign the same one. Sends hold the lock only for
  estimate-sign-broadcast, not for the receipt, so throughput stays workable;
  a request that can't acquire it within 20s degrades to the wallet.

Voting (`attestToLog`) is **not** relayed: the stake has to come from the voter's
own balance, so `attestToLogOnBehalf` would not do what the name suggests here.
Votes are sponsored on the `wallet` and `paymaster` rails only, which means a
plain EOA still pays gas to vote even though it logs for free.

## Setup

Run `bun run script:gasless-sponsor` at any point to see exactly which of these
steps is still outstanding. It derives the sponsor address from the configured
key and reports its `OPERATOR_ROLE` and balance; it sends nothing unless you
pass `--grant`.

1. Create an EOA for sponsorship and fund it with Base ETH. (Each log deploys a
   Zora coin, so budget accordingly — the daily caps above bound the spend.)
   0.01 ETH covers roughly 900 logs.
2. Grant it `OPERATOR_ROLE` on `LogADog`. `addOperator` is
   `onlyRole(DEFAULT_ADMIN_ROLE)`, and the constructor granted that role only to
   the account that deployed the contract — so this must be signed by the
   deployer key, not just any admin-ish key you have lying around:

   ```
   bun run script:gasless-sponsor --grant     # signs with ADMIN_PRIVATE_KEY
   ```

   The script checks `hasRole(DEFAULT_ADMIN_ROLE, …)` first, so a wrong key is
   reported as a wrong key instead of reverting on-chain. Equivalent by hand:

   ```
   cast send 0x6CfB88C8d0d7FFC563155e13C62b4Fa17bc25974 "addOperator(address)" $SPONSOR_ADDRESS \
     --rpc-url https://mainnet.base.org --private-key $ADMIN_PRIVATE_KEY
   ```

3. Set the environment variables:

   | Variable | Purpose |
   | --- | --- |
   | `LOGADOG_SPONSOR_PK` | sponsor private key (server-only). Accepts a bare or `0x`-prefixed key. Falls back to `LOGADOG_KEEPER_PK` if unset — that key only works if it *also* holds `OPERATOR_ROLE`, and it already signs the hourly resolve cron outside the relay's nonce lock, so prefer a dedicated key. |
   | `NEXT_PUBLIC_LOGADOG_SPONSOR_ADDRESS` | the matching address, so the feed can hide the "via &lt;relayer&gt;" byline without a request. Optional: `useSponsorAddress` asks the server when it's absent. |

   On Vercel, set these for **every environment you test in** — a Preview
   deployment does not inherit Production env vars. `NEXT_PUBLIC_*` values are
   inlined at build time, and `getSponsorAccount` caches the key at module
   scope, so **redeploy** after changing either.

Keep the sponsor topped up. Every log costs it gas now, not just EOA logs.

Until this is configured, `hotdog.getGaslessLoggingStatus` reports
`available: false`, every log falls back to the wallet's own rail, and the modal
tells plain-EOA users they'll pay a small gas fee. In-app and EIP-5792 smart
wallets stay gasless throughout — nothing breaks while you set this up.

## When an EOA still gets a signature prompt

That is the fallback: the relay declined, so the client sent from the wallet.
`getGaslessLoggingStatus` returns a `reason` saying which:

| `reason` | Meaning |
| --- | --- |
| `not-signed-in` | The visitor has a connected wallet but no next-auth session. `logGasless` is a `protectedProcedure` and reads `eater` from the session, so it can't relay for them. Note logging needed **no** session before the relay existed, so this is a real behaviour change: connect-only users silently pay their own gas until they sign in. |
| `not-configured` | Neither `LOGADOG_SPONSOR_PK` nor `LOGADOG_KEEPER_PK` is set in this environment. |
| `invalid-key` | A key is set but isn't a usable private key. |
| `missing-operator-role` | The sponsor exists but can't call `logHotdogOnBehalf` — step 2 above. |
| `check-failed` | The on-chain role read threw (RPC/`THIRDWEB_SECRET_KEY`). |

It's logged to the browser console on open, and to the server log with the exact
`addOperator` call needed. `TOO_MANY_REQUESTS` from `logGasless` is separate: a
rate limit, which deliberately does *not* fall back to charging a plain EOA.

## Verifying

Check `logger` in the `HotdogLogged` event to see which path a log took: the
relay leaves the sponsor there, every fallback leaves `logger == eater`.

- **In-app wallet (Google/email login)**: log a dog with an account holding zero
  ETH. It should succeed with no gas prompt, and `logger` should be the sponsor
  — if it's the user's own address, the relay was skipped and the wallet's
  EIP-7702 rail covered it instead.
- **Base App / Coinbase Smart Wallet**: the modal should read "Gas is on us" and
  the transaction should confirm without a fee.
- **MetaMask with zero ETH**: the modal should read "Gas is on us" once the
  sponsor is configured, and the log should succeed with no wallet prompt at all
  (the relay signs it, so MetaMask is never asked).
- **Feed**: no card should show a "via &lt;sponsor&gt;" byline.
- **"Pay my own gas fees"** in Advanced options still skips the relay and routes
  through the normal user-paid `TransactionButton`.

# Log a Dog — Mobile (Expo)

React Native app for [Log a Dog](https://logadog.xyz), sharing the backend and [`@logadog/shared`](../shared/) data layer with the Next.js web app.

## Prerequisites

- [Bun](https://bun.sh) (repo package manager)
- Node 20+
- Expo CLI / EAS CLI for device builds
- iOS Simulator (macOS) or Android emulator

## Setup

1. Install dependencies from the **repo root** (workspaces link `mobile` + `shared`):

   ```bash
   bun install
   ```

2. Copy environment variables:

   ```bash
   cp mobile/.env.example mobile/.env.local
   ```

   Required vars:

   | Variable | Description |
   |----------|-------------|
   | `EXPO_PUBLIC_API_URL` | Next.js backend URL (e.g. `https://logadog.xyz` or `http://localhost:3000`) |
   | `EXPO_PUBLIC_THIRDWEB_CLIENT_ID` | Public Thirdweb client ID (same value as web `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`; restart Expo after changing it) |
   | `EXPO_PUBLIC_CHAIN_ID` | `8453` (Base mainnet) or `84532` (Base Sepolia) |

3. Generate tRPC types (required before `typecheck`):

   ```bash
   bun run build:api-types
   ```

## Development

```bash
cd mobile
bun run start        # Expo dev server
bun run ios          # Run on iOS simulator
bun run android      # Run on Android emulator
bun run typecheck    # TypeScript check
```

## Architecture

- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (`mobile/app/`)
- **API:** tRPC client → `${API_URL}/api/trpc` with NextAuth session cookie
- **Auth:** Farcaster relay, email OTP, Google via Thirdweb in-app wallet → NextAuth SIWE
- **Wallet:** `WalletProvider` persists in-app wallet + WalletConnect for on-chain actions (stake, comments, revoke)
- **Shared logic:** `@shared/*` types, feed transforms, addresses, season, format

The mobile sign-in screen intentionally uses native auth controls instead of the
web `ConnectButton`. Thirdweb's web modal depends on browser and Next.js APIs,
so mobile mirrors the same choices with WalletConnect, Farcaster, Google, and
email flows that all complete a SIWE login against the shared NextAuth backend.

## Feature parity with web

| Feature | Status |
|---------|--------|
| Feed, log, judge, leaderboard | Native |
| Earn (stake, claim, buy, airdrop) | Native |
| Profile (address / username / id routes) | Native |
| Comments (read + write) | Native |
| Share, revoke, Zora flip stats | Native |
| Voting | Server wallet (`hotdog.judge`) by default; swipe on judge queue |

## EAS builds

Profiles are defined in [`eas.json`](eas.json). Example preview APK:

```bash
cd mobile
eas build --profile preview --platform android
```

Merges to `main` submit fresh EAS preview builds through GitHub Actions:

- Android: `preview` profile, APK build
- iOS: `preview-ios` profile, internal distribution build

Required GitHub repository secrets:

- `EXPO_TOKEN`: Expo access token for submitting EAS builds

Required EAS `preview` environment variable:

- `EXPO_PUBLIC_THIRDWEB_CLIENT_ID`: public Thirdweb client ID used by the mobile bundle (same value as web `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`)

## CI

Root CI runs `bun run typecheck` (web + shared), `bun run build:api-types`, then `cd mobile && bun run typecheck`.

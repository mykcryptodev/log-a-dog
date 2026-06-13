# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

> **Package manager**: This repo uses **bun** (`bun.lock` is the only committed lockfile). Use `bun install` / `bun run <script>`. The scripts below are defined in `package.json`.

### Core Development
- `bun run dev` - Start Next.js development server
- `bun run build` - Build Next.js application for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run postinstall` - Generate Prisma client (runs automatically after install)

### Database Commands
- `bun run db:push` - Push Prisma schema changes to database
- `bun run db:studio` - Open Prisma Studio for database inspection

### Scripts
- `bun run script:generate-merkle` - Generate the airdrop Merkle root (`airdrop/generate-merkle-root.ts`)
- `bun run script:generate-merkle:base` - Generate Merkle root for Base Mainnet
- `bun run script:generate-merkle:testnet` - Generate Merkle root for Base Sepolia

> Note: the `package.json` `script:fix-addresses` / `script:migrate-events` / `script:diagnose` / `script:link-specific` entries reference `src/scripts/*.ts`, which no longer exists. Treat them as stale until those files are restored.

### Contract Development (Foundry)
- `cd contracts && forge build` - Compile Solidity contracts
- `cd contracts && forge test` - Run contract tests
- `cd contracts && ./deploy.sh` - Deploy contracts to testnet
- `cd contracts && ./deploy-secure.sh` - Secure deployment script

## Architecture Overview

### Frontend (Next.js T3 Stack)
- **Framework**: Next.js 14 (**Pages Router** — code lives in `src/pages/`, there is no `src/app/`). API routes are in `src/pages/api/`.
- **Styling**: Tailwind CSS with DaisyUI components
- **State Management**: tRPC for type-safe API calls
- **Authentication**: NextAuth.js with Farcaster integration
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Web3**: Thirdweb SDK for blockchain interactions

### Backend API Structure
- **tRPC Routers** (`src/server/api/routers/`):
  - `attestation.ts` - Attestation management and validation
  - `comments.ts` - Comments on dog logs
  - `contest.ts` - Contest/competition logic
  - `engine.ts` - Thirdweb Engine / server-wallet transaction helpers
  - `ghost.ts` - Reads on-chain data via the GhostGraph indexer (see below)
  - `hotdog.ts` - Hot dog event processing
  - `profile.ts` - User profile management
  - `staking.ts` - Staking mechanism
  - `user.ts` - User account operations
  - `warpcast.ts` - Warpcast/Farcaster integration
- **Plain API routes** (`src/pages/api/`): webhooks (`webhook/dog-events`, `webhook/attestation-resolved`), the cron endpoint (`cron/reward-moderators`), OG image generation (`og/[logId]`), `image-proxy`, `ghostgraph`, and `judge` (image moderation).

### Smart Contracts (`contracts/src/`)
- `LogADog.sol` - Main logging contract for dog events
- `AttestationManager.sol` - Handles attestation validation
- `HotdogStaking.sol` - Staking rewards system
- `HotdogToken.sol` - ERC20 token contract
- `CoinDeploymentManager.sol` - Manages Zora coin deployments

### Key Data Models
- **DogEvent**: Core entity tracking dog photos/events with blockchain verification
- **User**: Linked to Farcaster accounts with optional Ethereum addresses
- **Attestation**: Validation system for dog events with staking mechanics

### Blockchain Integration
- **Chains**: Base Sepolia (development, chainId 84532), Base Mainnet (production, chainId 8453). Per-chain ABIs/addresses live in `src/constants/` and `src/thirdweb/{8453,84532}/`.
- **Thirdweb Integration**: Contract interactions and wallet connections
- **Thirdweb Engine + server wallet**: Backend-initiated transactions (e.g. the moderator-rewards cron, resolving attestation periods) are sent through Thirdweb Engine using a server wallet, not a user wallet. See `engine.ts` and the `THIRDWEB_ENGINE_*` / `*_WALLET_*` env vars.
- **Attestation System**: EAS (Ethereum Attestation Service) integration
- **Zora Protocol**: Coin creation and trading functionality (`@zoralabs/coins-sdk`) — each dog log mints a Zora coin

### Data Flow & On-Chain Sync (important)
The **Supabase/Postgres DB is a cache/read-model of on-chain state, not the source of truth.** Understand this flow before changing how DogEvents or attestations are written:
1. Users perform actions on-chain via Thirdweb (`LogADog.sol`, `AttestationManager.sol`, etc.).
2. On-chain events are pushed to webhook endpoints (`/api/webhook/dog-events`, `/api/webhook/attestation-resolved`), which upsert into the DB idempotently (handles duplicates).
3. The hourly cron (`/api/cron/reward-moderators`) resolves expired attestation periods on-chain; the resolution webhook then writes results back to the DB.
4. The **GhostGraph indexer** (Ghost Protocol) provides queryable on-chain data; the `ghost.ts` router and `/api/ghostgraph` proxy read from it (auth via `GHOST_PROTOCOL_API_KEY`).
- Docs: `WEBHOOK_DOCUMENTATION.md`, `CRON_JOBS.md`.

### Caching
- Multi-layer: **Upstash Redis** (application data), HTTP/CDN cache headers, and Next.js ISR.
- Cache durations and `getOrSetCache`/pattern-based invalidation helpers live in `src/server/utils/redis.ts`.
- See `CACHING_STRATEGY.md` and `docs/ZORA_COIN_CACHING_IMPROVEMENTS.md` before adjusting cache behavior.

### Image Moderation
- Submitted images are screened via the **Google Vision API** (`GOOGLE_VISION_API_KEY`) through `/api/judge` to flag inappropriate content.

### Airdrop / Merkle Distribution
- The `airdrop/` directory contains the token airdrop tooling: Merkle root generation (`generate-merkle-root.ts`), setup, and on-chain root setting. See `airdrop/README.md` and `airdrop/MERKLE_ROOT_GENERATOR.md`.

### Authentication Flow
- Farcaster-based authentication using `@farcaster/auth-kit`
- Optional Ethereum wallet connection
- NextAuth.js session management

### Image Processing
- HEIC to JPG conversion support
- Drag and drop upload interface
- Sharp for image optimization

### External Integrations
- **Neynar**: Farcaster data and frame interactions
- **Upstash Redis**: Caching and session storage
- **Vercel OG**: Dynamic social media image generation
- **Prisma**: Database ORM with PostgreSQL (Supabase) — migrations also tracked in `supabase/migrations/`
- **GhostGraph (Ghost Protocol)**: On-chain data indexing/querying
- **Google Vision**: Image content moderation
- **Telegram**: Optional notifications (`TELEGRAM_*` env vars)

### Automated Jobs
- **Moderator Rewards Cron**: Runs hourly to automatically distribute rewards for resolved attestation periods
  - Path: `/api/cron/reward-moderators`
  - Schedule: Every hour (`0 * * * *`)
  - See `CRON_JOBS.md` for detailed documentation

## Development Notes

### Environment Setup
- Uses `.env` files for configuration. **All env vars are validated by a Zod schema in `src/env.js`** (via `@t3-oss/env-nextjs`) — add new vars there or the build/runtime will reject them.
- Prisma generates client on postinstall
- Database URL (`DATABASE_URL`) and direct URL (`DIRECT_URL`) required for Prisma
- Key secrets: `THIRDWEB_*` / wallet vars, `NEYNAR_API_KEY`, `GHOST_PROTOCOL_API_KEY`, `UPSTASH_REDIS_REST_*`, `GOOGLE_VISION_API_KEY`, `CRON_SECRET`, `NEXTAUTH_SECRET`

### Build Process
- **IMPORTANT**: Always run `bun run build` before committing changes to ensure TypeScript and linting errors are caught
- Use `SKIP_ENV_VALIDATION=true bun run build` if environment variables are not set up locally
- Build process includes TypeScript type checking and ESLint validation

### Testing
- Foundry for smart contract testing
- No specific frontend test framework configured

### Deployment
- Configured for Vercel deployment
- Contract deployment via Foundry scripts
- Database migrations via Prisma
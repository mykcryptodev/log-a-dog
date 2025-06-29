# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postinstall` - Generate Prisma client (runs automatically after install)

### Database Commands
- `npm run db:push` - Push Prisma schema changes to database
- `npm run db:studio` - Open Prisma Studio for database inspection

### Scripts
- `npm run script:fix-addresses` - Fix address case inconsistencies
- `npm run script:migrate-events` - Migrate dog events data
- `npm run script:diagnose` - Diagnose linking issues
- `npm run script:link-specific` - Link specific unlinked events

### Contract Development (Foundry)
- `cd contracts && forge build` - Compile Solidity contracts
- `cd contracts && forge test` - Run contract tests
- `cd contracts && ./deploy.sh` - Deploy contracts to testnet
- `cd contracts && ./deploy-secure.sh` - Secure deployment script

## Architecture Overview

### Frontend (Next.js T3 Stack)
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS with DaisyUI components
- **State Management**: tRPC for type-safe API calls
- **Authentication**: NextAuth.js with Farcaster integration
- **Database**: PostgreSQL with Prisma ORM
- **Web3**: Thirdweb SDK for blockchain interactions

### Backend API Structure
- **tRPC Routers** (`src/server/api/routers/`):
  - `attestation.ts` - Attestation management and validation
  - `contest.ts` - Contest/competition logic
  - `engine.ts` - Core engine functionality
  - `hotdog.ts` - Hot dog event processing
  - `profile.ts` - User profile management
  - `staking.ts` - Staking mechanism
  - `user.ts` - User account operations
  - `warpcast.ts` - Warpcast/Farcaster integration

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
- **Chains**: Base Sepolia (development), Base Mainnet (production)
- **Thirdweb Integration**: Contract interactions and wallet connections
- **Attestation System**: EAS (Ethereum Attestation Service) integration
- **Zora Protocol**: Coin creation and trading functionality

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
- **Prisma**: Database ORM with PostgreSQL

## Development Notes

### Environment Setup
- Uses `.env` files for configuration
- Prisma generates client on postinstall
- Database URL and direct URL required for Prisma
- Farcaster and Thirdweb API keys needed

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
# Caching Strategy

This document outlines the comprehensive caching strategy used in the log-a-dog application to optimize performance and reduce API calls.

## Overview

The application uses a multi-layered caching approach:
- **Redis caching** for application data
- **HTTP cache headers** for CDN optimization
- **Next.js ISR** for static page generation
- **Pattern-based cache invalidation** for data consistency

## Cache Durations

All cache durations are defined in `src/server/utils/redis.ts`:

```typescript
export const CACHE_DURATION = {
  SHORT: 60,        // 1 minute - for rapidly changing data
  MEDIUM: 300,      // 5 minutes - for user profiles and search results  
  LONG: 3600,       // 1 hour - for IPFS metadata and static content
  VERY_LONG: 86400, // 24 hours - for permanent or rarely changing data
} as const;
```

## Cache Usage by Data Type

### User Profiles (`profile.ts`)
- **Duration**: `MEDIUM` (5 minutes)
- **Cache Keys**: 
  - `profile:${chainId}:${address}`
  - `profile:${chainId}:username:${username}`
  - `profile:${chainId}:search:${query}`
- **Rationale**: User profiles change infrequently but need reasonable freshness

### Hotdog Events (`hotdog.ts`)
- **Main Query**: `LONG` (1 hour) - Re-enabled from development disabled state
- **Individual Lookup**: `MEDIUM` (5 minutes)
- **IPFS Metadata**: `LONG` (1 hour) - External data rarely changes
- **Cache Keys**:
  - `hotdogs:${chainId}:${user}:${start}:${limit}`
  - `hotdog:${chainId}:${logId}:${user}`
  - `metadata:${uri}`

### Leaderboards (`hotdog.ts`)
- **Duration**: `MEDIUM` (5 minutes)
- **Cache Key**: `leaderboard:${chainId}:${startDate}:${endDate}`
- **Rationale**: Leaderboards are computationally expensive but can tolerate brief staleness

### Staking Data (`staking.ts`)
- **APY Calculation**: `SHORT` (1 minute)
- **Cache Key**: `staking:${chainId}:apy`
- **Rationale**: Financial data requires high freshness

### External API Data
- **Neynar Profiles**: `MEDIUM` (5 minutes)
- **Zora Coin Details**: `MEDIUM` (5 minutes)
- **Cache Keys**:
  - `neynar:${addresses}`
  - `zora-coin:${chainId}:${address}`

## HTTP Cache Headers

Implemented via Next.js middleware (`src/middleware.ts`):

### Static Assets
- **Duration**: 1 year with immutable flag
- **Headers**: `Cache-Control: public, max-age=31536000, immutable`

### API Routes
- **Metadata/IPFS**: 1 hour (`max-age=3600`)
- **Profiles/Leaderboards**: 15 minutes (`max-age=900`)
- **Dynamic Content**: 1 minute (`max-age=60`)
- **Auth/User-specific**: No cache (`private, no-cache`)

### Pages
- **Static Pages** (/, /about): Cached indefinitely
- **User-specific Pages**: No cache (`private, no-cache`)

## ISR (Incremental Static Regeneration)

### Homepage
- **Revalidation**: None - page is built at deploy time and not revalidated
- **Implementation**: `getStaticProps` without a `revalidate` value

## Cache Invalidation Strategy

### Pattern-Based Invalidation
- **Hotdog Operations**: Invalidates `hotdogs:${chainId}:*` and `leaderboard:${chainId}:*`
- **Profile Updates**: Invalidates `profile:${chainId}:*`
- **Implementation**: Uses Redis `KEYS` command with pattern matching

### Automatic Invalidation Triggers
- **New Dog Event**: Clears hotdog and leaderboard caches
- **Attestation Resolution**: Clears related hotdog caches
- **Profile Creation**: Clears profile caches for the chain

## Cache Utilities

Located in `src/server/utils/redis.ts`:

### Core Functions
- `getCachedData<T>(key)` - Retrieve cached data
- `setCachedData<T>(key, data, ttl)` - Store data with TTL
- `getOrSetCache<T>(key, fetchFn, ttl)` - Get or fetch and cache pattern
- `invalidateCache(key)` - Delete single cache entry
- `deleteCachedData(pattern)` - Pattern-based deletion

### Advanced Functions
- `warmCache<T>(key, fetchFn, ttl)` - Pre-populate cache
- `getCacheInfo(key)` - Get cache metrics for monitoring

## Performance Considerations

### Cache Hit Rate Optimization
- Longer TTLs for stable data (profiles, metadata)
- Shorter TTLs for dynamic data (staking APY, live feeds)
- Pattern-based keys for efficient batch invalidation

### Memory Management
- TTL-based expiration prevents unbounded growth
- Pattern-based cleanup for related data
- Monitoring utilities for cache performance tracking

### Error Handling
- All cache operations include try-catch blocks
- Graceful degradation when Redis is unavailable
- Logging for debugging cache issues

## Monitoring and Debugging

### Cache Key Patterns
All cache keys follow consistent patterns for easy identification:
- `{entity}:{chainId}:{identifier}`
- `{entity}:{chainId}:{type}:{value}`

### Logging
- Cache misses and errors are logged to console
- Pattern-based operations include operation counts
- Failed cache operations don't block application flow

## Best Practices

1. **Always include chainId** in cache keys for multi-chain support
2. **Use pattern-based invalidation** for related data consistency
3. **Set appropriate TTLs** based on data change frequency
4. **Include error handling** for all cache operations
5. **Monitor cache hit rates** to optimize TTL values
6. **Use HTTP cache headers** in combination with application caching

## Future Optimizations

1. **Cache Warming**: Pre-populate frequently accessed data
2. **Cache Metrics**: Add hit/miss ratio monitoring
3. **Conditional Caching**: Skip caching during high-write periods
4. **Distributed Invalidation**: Coordinate cache clearing across instances
5. **Compression**: Compress large cached objects to reduce memory usage
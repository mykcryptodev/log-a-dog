# Zora Coin Caching Improvements

## Problem with Previous Implementation

The original caching strategy had a significant flaw:
- Coins were cached in chunks with keys like `zora-coins:${chunk.join(',')}`
- When a new coin was added, all existing cache keys became invalid
- This caused unnecessary re-fetching of all coin data

## New Implementation

### Individual Coin Caching

Each coin is now cached individually with a unique key:
```
zora-coin:{chainId}:{normalizedAddress}
```

### Benefits

1. **Persistent Caching**: When new coins are added, existing coin caches remain valid
2. **Efficient Fetching**: Only uncached coins are fetched from the API
3. **Granular Control**: Individual coins can be invalidated or refreshed without affecting others
4. **Reduced API Calls**: Significantly fewer API calls when dealing with mixed cached/uncached coins

### How It Works

1. When requesting multiple coins:
   - First check cache for each individual coin
   - Collect addresses of uncached coins
   - Fetch only uncached coins from the API in batches
   - Cache each fetched coin individually

2. Cache Management Utilities:
   - `invalidateZoraCoinCache()`: Remove cache for a specific coin
   - `prewarmZoraCoinCache()`: Pre-load cache for specific coins
   - `refreshZoraCoinData()`: Force refresh a specific coin's data

### Performance Impact

- **Before**: Adding 1 new coin invalidated cache for ALL coins
- **After**: Adding 1 new coin only requires fetching that 1 coin

This results in much better performance and reduced load on the Zora API, especially as the number of coins grows.
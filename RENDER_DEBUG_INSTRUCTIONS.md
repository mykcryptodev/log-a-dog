# Infinite Re-render Debugging Guide

## Overview

This guide explains how to identify and resolve infinite re-render issues on the homepage using the newly added debugging tools.

## Debugging Components Added

### 1. RenderTracker (`/src/components/debug/RenderTracker.tsx`)
- Tracks re-renders for individual components
- Monitors dependency changes that trigger re-renders
- Provides console logging and visual alerts for excessive renders
- Automatically detects infinite render loops (>10 renders in 1 second)

### 2. RenderMonitor (`/src/components/debug/RenderMonitor.tsx`)
- Central monitoring dashboard for all component renders
- Shows statistics about render frequency and problematic components
- Provides a UI to configure alert thresholds and clear data
- Only visible in development mode

## Components Currently Being Tracked

All major homepage components are now wrapped with RenderTracker:

1. **CreateAttestation** - The main "Log a Dog" component
2. **LeaderboardBanner** - Scrolling banner at top
3. **LeaderboardList** - Static leaderboard list
4. **ListAttestations** - Dog event feed

## How to Use the Debugging Tools

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Open the Homepage
Navigate to `http://localhost:3000` and open your browser's developer console.

### Step 3: Monitor for Re-renders
- Check the console for re-render logs
- Look for the blue "Render Monitor" button in the bottom left
- Click it to open the monitoring dashboard

### Step 4: Identify Problem Components
Watch for:
- **Red alerts** in the UI for components with excessive renders
- **Console warnings** about infinite render loops
- **Dependency change logs** showing what's triggering re-renders

## Common Patterns to Look For

### 1. Unstable Hook Dependencies
```javascript
// ❌ BAD - Creates new object every render
const memoizedValue = useMemo(() => someComputation(), [{ prop: value }]);

// ✅ GOOD - Stable dependencies
const memoizedValue = useMemo(() => someComputation(), [value]);
```

### 2. Missing Memoization
```javascript
// ❌ BAD - New function every render
const handleClick = () => doSomething();

// ✅ GOOD - Memoized function
const handleClick = useCallback(() => doSomething(), [dependency]);
```

### 3. Thirdweb Hook Issues
Based on the code analysis, potential issues in CreateAttestation:

- `useActiveWallet()` vs `useStableWallet()` - Check if the stable version is actually stable
- `useActiveAccount()` vs `useStableAccount()` - Monitor for reference changes
- `wallet?.exists` property - May be changing unexpectedly

## Key Areas of Investigation

### CreateAttestation Component
Focus on lines 74-77 where `walletExists` and `isDisabled` are computed:

```typescript
const walletExists = !!stableWallet?.exists;
const isDisabled = useMemo(() => {
  return !imgUri || !walletExists || isLoading;
}, [imgUri, isLoading, walletExists]);
```

**Potential Issues:**
1. `stableWallet?.exists` may not be truly stable
2. The `useStableWallet` hook might have internal reference changes
3. The `useMemo` dependency array might be missing something

### To Debug This Specific Issue:

1. Watch the console for "CreateAttestation" re-render logs
2. Look for which dependencies are changing:
   - `stableWalletId` 
   - `stableWalletExists`
   - `walletExists`
   - `isDisabled`

## Analysis Results

Based on the code examination, here are the most likely culprits:

### 1. useStableWallet Hook Issues
The `useStableWallet` hook in `/src/hooks/useStableAccount.ts` may not be as stable as intended:

```typescript
return useMemo(() => {
  if (!isConnected) return null;
  
  return {
    id: walletId!,
    isConnected: true,
    exists: true, // ← This hardcoded value might be problematic
  };
}, [isConnected, walletId]);
```

**Problem:** The `exists: true` is hardcoded and doesn't reflect the actual wallet state.

### 2. Thirdweb Hook Instability
The underlying `useActiveWallet()` hook from Thirdweb might be causing reference changes that propagate through the stable wrapper.

### 3. Upload Component Effect
The debounced upload effect (lines 47-72) in CreateAttestation could be triggering re-renders through:
- `coinMetadataUri` state changes
- Image upload side effects

## Recommended Fixes

### Fix 1: Improve useStableWallet Hook
```typescript
export const useStableWallet = () => {
  const wallet = useActiveWallet();
  
  return useMemo(() => {
    if (!wallet) return null;
    
    return {
      id: wallet.id,
      isConnected: true,
      exists: !!wallet, // ← More accurate existence check
    };
  }, [wallet?.id, !!wallet]); // ← More specific dependencies
};
```

### Fix 2: Investigate Thirdweb Hook Updates
Check if Thirdweb hooks are causing unnecessary re-renders by:
1. Updating to latest versions
2. Using their built-in memoization if available
3. Adding additional stability layers

### Fix 3: Optimize Upload Effect Dependencies
Review the upload effect dependencies to ensure they're minimal and stable.

## Next Steps

1. **Run the debugging tools** and monitor the console output
2. **Identify which component** is causing excessive re-renders
3. **Focus on the specific dependencies** that are changing
4. **Apply targeted fixes** based on the findings
5. **Test the fixes** to ensure the infinite re-renders stop

## Removing Debug Tools

Once the issue is resolved, remove or disable the debug components:

1. Remove `<RenderMonitor />` from the homepage
2. Remove `<RenderTracker>` wrappers from components
3. Delete the debug files if not needed for future debugging

The debug tools are designed to be non-intrusive and only active in development mode.
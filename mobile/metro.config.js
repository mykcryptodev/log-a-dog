const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Shared data layer lives at repo root in ../shared and is consumed via the
// "@shared" alias. Metro must watch it (it's outside the project root) and be
// told how to resolve the alias.
const sharedRoot = path.resolve(__dirname, "../shared");
const repoRoot = path.resolve(__dirname, "..");
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot, repoRoot];

// Required for Thirdweb React Native v5 package exports
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  "react-native",
  "browser",
  "require",
];

// Polyfill Node.js built-ins that some thirdweb sub-modules reference
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve("react-native-quick-crypto"),
  stream: require.resolve("readable-stream"),
  // Force the Node.js build of brotli-wasm — the web/ESM build uses import.meta
  // which Hermes does not support
  "brotli-wasm": path.resolve(
    __dirname,
    "node_modules/brotli-wasm/index.node.js"
  ),
};

const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

// Resolve the "@shared" alias to the repo-root shared/ data layer. A custom
// resolveRequest is used (instead of extraNodeModules) because "@shared/..."
// looks like a scoped package to Metro's default resolver, which wouldn't map
// the subpath. Applied after withNativeWind so it isn't overwritten.
const baseResolveRequest = nativeWindConfig.resolver.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@shared" || moduleName.startsWith("@shared/")) {
    const sub =
      moduleName === "@shared" ? "index" : moduleName.slice("@shared/".length);
    return context.resolveRequest(
      context,
      path.resolve(sharedRoot, sub),
      platform
    );
  }
  return (baseResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform
  );
};

module.exports = nativeWindConfig;

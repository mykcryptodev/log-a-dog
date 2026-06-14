const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

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

module.exports = withNativeWind(config, { input: "./global.css" });

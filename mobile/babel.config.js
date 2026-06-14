module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        { jsxImportSource: "nativewind", unstable_transformImportMeta: true },
      ],
    ],
    plugins: [
      require("react-native-css-interop/dist/babel-plugin").default,
      [
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "automatic",
          importSource: "react-native-css-interop",
        },
      ],
      // react-native-worklets/plugin is intentionally omitted — it's only needed
      // for Reanimated 4+; we're on Reanimated 3.
      "react-native-reanimated/plugin",
    ],
  };
};

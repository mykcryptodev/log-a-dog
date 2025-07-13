/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
if (!process.env.SKIP_ENV_VALIDATION) {
  await import("./src/env.js");
}

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['thirdweb', '@farcaster/frame-sdk']
  },

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  transpilePackages: ['react-tweet', '@farcaster/frame-sdk'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      }
    ]
  },
};

export default config;

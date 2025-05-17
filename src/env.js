import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL"
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url()
    ),
    THIRDWEB_SECRET_KEY: z.string(),
    THIRDWEB_ENGINE_ACCESS_TOKEN: z.string(),
    THIRDWEB_ENGINE_URL: z.string().url(),
    THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN: z.string(),
    THIRDWEB_SERVER_WALLET_ADDRESS: z.string(),
    BACKEND_WALLET_ADDRESS: z.string(),
    BACKEND_PROFILE_WALLET_ADDRESS: z.string(),
    NEYNAR_WEBHOOK_SECRET: z.string(),
    NEYNAR_API_KEY: z.string(),
    ADMIN_PRIVATE_KEY: z.string(),
    MORALIS_SECRET_KEY: z.string(),
    MAKER_AFFIRM_SECRET: z.string(),
    GOOGLE_VISION_API_KEY: z.string(),
    UPSTASH_REDIS_REST_URL: z.string(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: z.string(),
    NEXT_PUBLIC_BACKEND_SMART_WALLET_ADDRESS: z.string(),
    NEXT_PUBLIC_APP_URL: z.string(),
    NEXT_PUBLIC_APP_DOMAIN: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
    THIRDWEB_ENGINE_ACCESS_TOKEN: process.env.THIRDWEB_ENGINE_ACCESS_TOKEN,
    THIRDWEB_ENGINE_URL: process.env.THIRDWEB_ENGINE_URL,
    NEYNAR_WEBHOOK_SECRET: process.env.NEYNAR_WEBHOOK_SECRET,
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
    BACKEND_WALLET_ADDRESS: process.env.BACKEND_WALLET_ADDRESS,
    THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN: process.env.THIRDWEB_SERVER_WALLET_VAULT_ACCESS_TOKEN,
    THIRDWEB_SERVER_WALLET_ADDRESS: process.env.THIRDWEB_SERVER_WALLET_ADDRESS,
    NEXT_PUBLIC_BACKEND_SMART_WALLET_ADDRESS: process.env.NEXT_PUBLIC_BACKEND_SMART_WALLET_ADDRESS,
    BACKEND_PROFILE_WALLET_ADDRESS: process.env.BACKEND_PROFILE_WALLET_ADDRESS,
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    MORALIS_SECRET_KEY: process.env.MORALIS_SECRET_KEY,
    MAKER_AFFIRM_SECRET: process.env.MAKER_AFFIRM_SECRET,
    GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

/**
 * Shared data layer for Log a Dog — consumed by both the web (Next.js) and
 * mobile (Expo) apps via the `@shared/*` path alias.
 *
 * Everything here is pure TypeScript (no React / RN / Node deps) so it can be
 * bundled by webpack and Metro alike. UI, tRPC client instances, and platform
 * wiring live in each app; this layer holds the types, formatting, constants,
 * and pure data transforms they share.
 */
export * from "./types";
export * from "./format";
export * from "./constants";
export * from "./season";
export * from "./feed";
export * from "./time";
export * from "./addresses";
export * from "./comments";
export * from "./pending";
export * from "./profile";
export * from "./merkle";

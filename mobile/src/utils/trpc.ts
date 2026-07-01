import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { API_URL } from "~/constants";
// AppRouter type comes from a generated, self-contained declaration bundle
// (mobile/api-types, produced by `bun run build:api-types` at the repo root).
// It's a type-only import, so Metro/Babel erases it — the app bundles and runs
// without the bundle present; only `tsc` needs it (CI generates it first).
import type { AppRouter } from "@apiTypes/src/server/api/root";

export const trpc = createTRPCReact<AppRouter>();

export function buildTRPCClient(sessionToken?: string | null) {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
        headers() {
          const headers: Record<string, string> = {};
          if (sessionToken) {
            headers["Cookie"] = `next-auth.session-token=${sessionToken}`;
          }
          return headers;
        },
      }),
    ],
  });
}

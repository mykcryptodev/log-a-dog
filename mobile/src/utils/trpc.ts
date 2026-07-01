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
        // Infra errors (413 Request Entity Too Large, 502 HTML pages, …) come
        // back as plain text; without this guard they surface as a cryptic
        // "JSON Parse error: Unexpected character".
        async fetch(url, options) {
          const res = await fetch(url as RequestInfo, options as RequestInit);
          const contentType = res.headers.get("content-type") ?? "";
          if (!res.ok && !contentType.includes("application/json")) {
            const body = await res.text().catch(() => "");
            throw new Error(
              `The server returned an unexpected response (${res.status} ${res.statusText || "error"}). ${body.slice(0, 140)}`.trim(),
            );
          }
          return res;
        },
        headers() {
          const headers: Record<string, string> = {};
          if (sessionToken) {
            headers["Cookie"] = [
              `next-auth.session-token=${sessionToken}`,
              `__Secure-next-auth.session-token=${sessionToken}`,
            ].join("; ");
          }
          return headers;
        },
      }),
    ],
  });
}

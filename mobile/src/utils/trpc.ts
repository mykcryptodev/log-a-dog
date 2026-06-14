import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { API_URL } from "~/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<any>();

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

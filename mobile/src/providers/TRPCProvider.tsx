import React, { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, buildTRPCClient } from "~/utils/trpc";
import { useAuth } from "~/providers/AuthProvider";

function TRPCInner({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 30_000,
          },
        },
      }),
  );

  const trpcClient = useMemo(
    () => buildTRPCClient(session?.sessionToken),
    [session?.sessionToken],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return <TRPCInner>{children}</TRPCInner>;
}

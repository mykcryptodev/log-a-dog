import { trpc } from "~/utils/trpc";
import { CHAIN_ID, ZERO_ADDRESS } from "~/constants";
import type { ProcessedHotdog } from "~/types";

/**
 * Typed data hooks for the hotdog read endpoints. The tRPC client is currently
 * untyped (`createTRPCReact<any>`, see utils/trpc), so these wrappers are the
 * single place casts live — every screen consumes fully-typed results built on
 * the shared domain types.
 */

export interface Judge {
  voter: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
  profile: { username?: string; imgUrl?: string; address?: string };
}

export interface UseHotdogResult {
  hotdog?: ProcessedHotdog;
  validAttestations: string;
  invalidAttestations: string;
  userAttested: boolean;
  userAttestation: boolean;
  isLoading: boolean;
  refetch: () => void;
}

/** A single dog with the viewer's attestation state. */
export function useHotdog(logId: string, voter?: string): UseHotdogResult {
  const query = trpc.hotdog.getById.useQuery(
    { chainId: CHAIN_ID, user: voter ?? ZERO_ADDRESS, logId },
    { enabled: !!logId },
  );
  const data = query.data as
    | {
        hotdog?: ProcessedHotdog;
        validAttestations?: string;
        invalidAttestations?: string;
        userAttested?: boolean;
        userAttestation?: boolean;
      }
    | undefined;

  return {
    hotdog: data?.hotdog,
    validAttestations: data?.validAttestations ?? "0",
    invalidAttestations: data?.invalidAttestations ?? "0",
    userAttested: data?.userAttested ?? false,
    userAttestation: data?.userAttestation ?? false,
    isLoading: Boolean(query.isLoading),
    refetch: () => void query.refetch(),
  };
}

/** Ranked judges by accuracy. */
export function useJudges(): { judges: Judge[]; isLoading: boolean } {
  const query = trpc.hotdog.getJudges.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return {
    judges: (query.data as Judge[] | undefined) ?? [],
    isLoading: Boolean(query.isLoading),
  };
}

/** Map of logId -> the viewer's prior vote (present only if they voted). */
export function useUserVotes(
  voter?: string,
): Record<string, boolean> | undefined {
  const query = trpc.hotdog.getUserVotes.useQuery(
    { voter: voter ?? "" },
    { enabled: !!voter, staleTime: 60_000 },
  );
  return query.data as Record<string, boolean> | undefined;
}

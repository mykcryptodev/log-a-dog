import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useActiveAccount } from "thirdweb/react";

/** Connected wallet address, falling back to the next-auth session address. */
export function useVoterAddress(): string | undefined {
  const { data: session } = useSession();
  const account = useActiveAccount();

  return useMemo(
    () => account?.address ?? session?.user?.address,
    [account?.address, session?.user?.address],
  );
}

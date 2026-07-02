import { useCallback, useState } from "react";
import { getContract, prepareContractCall } from "thirdweb";
import { trpc } from "~/utils/trpc";
import { useActiveAccount, useActiveWallet } from "~/providers/WalletProvider";
import { sendOnChainTx } from "~/hooks/useOnChainTx";
import { ATTESTATION_MANAGER } from "~/constants/addresses";
import { getActiveChain } from "~/constants/chains";
import { getThirdwebClient } from "~/utils/thirdweb";
import { CHAIN_ID } from "~/constants";

/**
 * The address a verdict is (or would be) attested from: the connected signer
 * wallet when there is one, otherwise the session address. Mirrors the web
 * useVoterAddress.
 */
export function useVoterAddress(): string | undefined {
  return useActiveAccount()?.address?.toLowerCase();
}

/**
 * Cast a valid/sus verdict on a log.
 *
 * When a signer wallet is connected the attestation is sent from that wallet
 * via `attestToLog` (gasless EIP-5792 when supported), mirroring the web
 * VoteBar — so the on-chain stake check runs against the wallet that actually
 * holds the stake. Routing every vote through the server `hotdog.judge`
 * mutation checked the *session* address instead, which wrongly reported
 * "Insufficient stake" whenever the stake lived on the connected wallet
 * (e.g. Farcaster session + external staking wallet).
 *
 * Signer-less sessions (Farcaster-only) still fall back to the server-wallet
 * `judge` mutation, which attests on behalf of the session address.
 */
export function useVote() {
  const wallet = useActiveWallet();
  const utils = trpc.useUtils();
  const judgeMutation = trpc.hotdog.judge.useMutation();
  const [isVoting, setIsVoting] = useState(false);

  const vote = useCallback(
    async ({ logId, isValid }: { logId: string; isValid: boolean }) => {
      setIsVoting(true);
      try {
        const account = wallet?.getAccount();
        if (account) {
          // Pre-flight: eligibility + required stake for the signing wallet.
          const stakeInfo = await utils.hotdog.getAttestationStakeInfo.fetch({
            chainId: CHAIN_ID,
            user: account.address,
          });
          if (!stakeInfo.canParticipate) {
            throw new Error("Insufficient stake");
          }

          const transaction = prepareContractCall({
            contract: getContract({
              address: ATTESTATION_MANAGER[CHAIN_ID]!,
              client: getThirdwebClient(),
              chain: getActiveChain(),
            }),
            method:
              "function attestToLog(uint256 logId, bool isValid, uint256 stakeAmount)",
            params: [BigInt(logId), isValid, BigInt(stakeInfo.minimumStake)],
          });
          await sendOnChainTx(wallet!, transaction);
          return;
        }

        await judgeMutation.mutateAsync({
          chainId: CHAIN_ID,
          logId,
          isValid,
          shouldRevoke: false,
        });
      } finally {
        setIsVoting(false);
      }
    },
    [wallet, utils, judgeMutation],
  );

  return { vote, isVoting };
}

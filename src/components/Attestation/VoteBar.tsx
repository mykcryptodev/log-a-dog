import { useState, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { getContract, sendTransaction } from "thirdweb";
import { useActiveWallet } from "thirdweb/react";
import { sendCalls, getCapabilities } from "thirdweb/wallets/eip5792";
import { api } from "~/utils/api";
import { client } from "~/providers/Thirdweb";
import { ATTESTATION_MANAGER } from "~/constants/addresses";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { attestToLog } from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { InsufficientStake } from "../Stake/InsufficientStake";
import { Portal } from "../utils/Portal";
import { useGhostVote } from "~/hooks/useGhostVote";

type Props = {
  logId: string;
  chainId: number;
  disabled?: boolean;
  /** Voting window closed — hide the buttons (the result meter lives on the
   *  back of the card photo, shown only once voting closes). */
  isExpired?: boolean;
  userAttested: boolean | undefined;
  userAttestation: boolean | undefined;
  // Kept on the type so callers can keep passing them; the live tally is no
  // longer rendered here (it moved to the flipped card back).
  validAttestations?: string | undefined;
  invalidAttestations?: string | undefined;
  onAttestationMade?: () => void;
  onAttestationAffirmationRevoked?: () => void;
};

// "Sticker Brutalism" vote control: two chunky blocky buttons whose hard offset
// shadow collapses on press, plus a "you voted" confirmation. The valid/sus
// tally meter has moved to the back of the card photo and is hidden while the
// voting window is open. Same on-chain `hotdog.judge` mutation + optimistic
// user-vote logic as before.
export const VoteBar: FC<Props> = ({
  logId,
  chainId,
  disabled,
  isExpired = false,
  userAttested,
  userAttestation,
  onAttestationMade,
}) => {
  const { data: sessionData } = useSession();
  const wallet = useActiveWallet();
  const utils = api.useUtils();
  const { mutateAsync: refreshFeed } = api.indexer.refreshFeed.useMutation();
  const [optimisticUserAttested, setOptimisticUserAttested] = useState<boolean | undefined>(userAttested);
  const [optimisticUserAttestation, setOptimisticUserAttestation] = useState<boolean | undefined>(userAttestation);
  const [isInsufficientStake, setIsInsufficientStake] = useState(false);
  const [busy, setBusy] = useState<null | "valid" | "invalid">(null);
  const [streak, setStreak] = useState<null | "valid" | "invalid">(null);

  const ghostVote = useGhostVote(logId, sessionData?.user?.address);
  // ghostVote is null (no vote), true (voted valid), or false (voted sus).
  // ?? cannot be used here: `false ?? x` returns `x`, masking a SUS vote.
  const effectiveUserAttested = ghostVote !== null || (optimisticUserAttested ?? false);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const effectiveUserAttestation = ghostVote !== null ? ghostVote : (optimisticUserAttestation ?? false);

  // Submit the attestation from the user's own wallet. thirdweb Engine is gone,
  // so we mirror Revoke.tsx: build the user-callable `attestToLog`, then prefer
  // a gasless EIP-5792 `sendCalls` through the thirdweb paymaster, falling back
  // to a normal `sendTransaction` for wallets without 5792 capabilities.
  const submitVote = async (isValid: boolean) => {
    if (!wallet) throw new Error("No wallet connected");
    const account = wallet.getAccount();
    if (!account) throw new Error("No wallet connected");

    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)!;
    const attestationContract = getContract({
      address: ATTESTATION_MANAGER[chainId]!,
      client,
      chain,
    });

    // Pre-flight: required stake + eligibility (was done in the server mutation).
    const stakeInfo = await utils.hotdog.getAttestationStakeInfo.fetch({
      chainId,
      user: account.address,
    });
    if (!stakeInfo.canParticipate) {
      throw new Error("Insufficient stake");
    }

    const transaction = attestToLog({
      contract: attestationContract,
      logId: BigInt(logId),
      isValid,
      stakeAmount: BigInt(stakeInfo.minimumStake),
    });

    const chainIdAsHex = chainId.toString(16) as unknown as number;
    const walletCapabilities = await getCapabilities({ wallet }).catch(() => null);
    if (walletCapabilities?.[chainIdAsHex]) {
      await sendCalls({
        chain,
        wallet,
        calls: [transaction],
        capabilities: {
          paymasterService: {
            url: `https://${chainId}.bundler.thirdweb.com/${client.clientId}`,
          },
        },
      });
    } else {
      await sendTransaction({ account, transaction });
    }
  };

  const vote = async (isValid: boolean) => {
    if ((disabled ?? false) || isExpired) return;
    if (!sessionData?.user?.address || !wallet) {
      toast.error("You must login to judge dogs!");
      return;
    }
    // The contract has no revoke; re-voting the same way is a no-op on-chain.
    if (effectiveUserAttested && effectiveUserAttestation === isValid) {
      return;
    }

    setBusy(isValid ? "valid" : "invalid");
    setStreak(isValid ? "valid" : "invalid");
    setTimeout(() => setStreak(null), 350);

    // Optimistic update.
    setOptimisticUserAttested(true);
    setOptimisticUserAttestation(isValid);

    try {
      await submitVote(isValid);
      toast.success("Verdict cast!");
      try {
        await refreshFeed({ chainId });
      } catch (error) {
        console.warn("Could not refresh indexed votes after verdict", error);
      }
      await utils.hotdog.getUserVotes.invalidate({ voter: sessionData.user.address });
      await utils.hotdog.getJudges.invalidate();
      void onAttestationMade?.();
    } catch (error) {
      setOptimisticUserAttested(userAttested);
      setOptimisticUserAttestation(userAttestation);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Insufficient stake")) {
        setIsInsufficientStake(true);
      } else {
        toast.error(`Operation failed: ${message}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const votedValid = effectiveUserAttested && effectiveUserAttestation === true;
  const votedSus = effectiveUserAttested && effectiveUserAttestation === false;
  const locked = (disabled ?? false) || busy !== null;

  // Once voting closes there's nothing to act on here — the tally lives on the
  // flipped card back. Still surface how *you* voted, if you did.
  if (isExpired) {
    return (votedValid || votedSus) ? (
      <div
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 font-display text-sm tracking-wide ${
          votedValid ? "bg-accent/20 text-accent" : "bg-error/20 text-error"
        }`}
      >
        ✓ you voted {votedValid ? "VALID DOG" : "SUS"}
      </div>
    ) : null;
  }

  return (
    <div className="w-full">
      <Portal>
        {isInsufficientStake && (
          <InsufficientStake isOpen={isInsufficientStake} onClose={() => setIsInsufficientStake(false)} />
        )}
      </Portal>

      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={locked}
          onClick={() => void vote(true)}
          className={`pop-btn relative flex-1 overflow-hidden rounded-xl py-3 font-display text-sm tracking-wide text-accent-content ${
            votedValid ? "bg-accent" : "bg-accent/85"
          }`}
        >
          <AnimatePresence>
            {streak === "valid" && (
              <motion.span
                initial={{ x: "-110%" }}
                animate={{ x: "110%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 bg-primary/70"
              />
            )}
          </AnimatePresence>
          <span className="relative">{votedValid ? "✓ " : ""}🥬 VALID DOG</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={locked}
          onClick={() => void vote(false)}
          className={`pop-btn relative flex-1 overflow-hidden rounded-xl py-3 font-display text-sm tracking-wide text-white ${
            votedSus ? "bg-error" : "bg-error/85"
          }`}
        >
          <AnimatePresence>
            {streak === "invalid" && (
              <motion.span
                initial={{ x: "-110%" }}
                animate={{ x: "110%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 bg-secondary/70"
              />
            )}
          </AnimatePresence>
          <span className="relative">{votedSus ? "✓ " : ""}🔴 SUS</span>
        </motion.button>
      </div>
    </div>
  );
};

export default VoteBar;

import { useState, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { InsufficientStake } from "../Stake/InsufficientStake";
import { Portal } from "../utils/Portal";
import { TransactionStatus } from "../utils/TransactionStatus";
import { useGhostVote } from "~/hooks/useGhostVote";

type Props = {
  logId: string;
  chainId: number;
  disabled?: boolean;
  /** Voting window closed — render a static result instead of buttons. */
  isExpired?: boolean;
  userAttested: boolean | undefined;
  userAttestation: boolean | undefined;
  validAttestations: string | undefined;
  invalidAttestations: string | undefined;
  onAttestationMade?: () => void;
  onAttestationAffirmationRevoked?: () => void;
};

// The heart of the card, "Sticker Brutalism" edition: two chunky blocky vote
// buttons whose hard offset shadow collapses on press, plus a fat ink-outlined
// tally meter with an oversized percentage. Same on-chain `hotdog.judge`
// mutation + optimistic logic as before — only the chrome changed.
export const VoteBar: FC<Props> = ({
  logId,
  chainId,
  disabled,
  isExpired = false,
  userAttested,
  userAttestation,
  validAttestations,
  invalidAttestations,
  onAttestationMade,
  onAttestationAffirmationRevoked,
}) => {
  const { data: sessionData } = useSession();
  const utils = api.useUtils();
  const { mutateAsync: refreshFeed } = api.indexer.refreshFeed.useMutation();
  const [optimisticValidCount, setOptimisticValidCount] = useState<string | undefined>(validAttestations);
  const [optimisticInvalidCount, setOptimisticInvalidCount] = useState<string | undefined>(invalidAttestations);
  const [optimisticUserAttested, setOptimisticUserAttested] = useState<boolean | undefined>(userAttested);
  const [optimisticUserAttestation, setOptimisticUserAttestation] = useState<boolean | undefined>(userAttestation);
  const [isInsufficientStake, setIsInsufficientStake] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "valid" | "invalid">(null);
  const [streak, setStreak] = useState<null | "valid" | "invalid">(null);

  const ghostVote = useGhostVote(logId, sessionData?.user?.address);
  // ghostVote is null (no vote), true (voted valid), or false (voted sus).
  // ?? cannot be used here: `false ?? x` returns `x`, masking a SUS vote.
  const effectiveUserAttested = ghostVote !== null || (optimisticUserAttested ?? false);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const effectiveUserAttestation = ghostVote !== null ? ghostVote : (optimisticUserAttestation ?? false);

  const valid = Number(optimisticValidCount ?? 0);
  const invalid = Number(optimisticInvalidCount ?? 0);
  const total = valid + invalid;
  const pct = total > 0 ? Math.round((valid / total) * 100) : 50;

  const judgeMutation = api.hotdog.judge.useMutation({
    onMutate: ({ isValid }) => {
      if (isValid) {
        setOptimisticValidCount((p) => (p ? (BigInt(p) + 1n).toString() : "1"));
      } else {
        setOptimisticInvalidCount((p) => (p ? (BigInt(p) + 1n).toString() : "1"));
      }
      setOptimisticUserAttested(true);
      setOptimisticUserAttestation(isValid);
    },
    onSuccess: (data) => {
      if (data) {
        setPendingTransactionId(data);
      } else {
        toast.success("Verdict cast!");
        void onAttestationMade?.();
      }
    },
    onError: (error) => {
      setOptimisticValidCount(validAttestations);
      setOptimisticInvalidCount(invalidAttestations);
      setOptimisticUserAttested(userAttested);
      setOptimisticUserAttestation(userAttestation);
      if (error.message.includes("Insufficient stake")) {
        setIsInsufficientStake(true);
      } else {
        toast.error(`Operation failed: ${error.message}`);
      }
    },
  });

  const revoke = async (isValid: boolean) => {
    if (!sessionData?.user?.address) return;
    try {
      if (isValid) {
        setOptimisticValidCount((p) => (p ? (BigInt(p) - 1n).toString() : "0"));
      } else {
        setOptimisticInvalidCount((p) => (p ? (BigInt(p) - 1n).toString() : "0"));
      }
      setOptimisticUserAttested(false);
      setOptimisticUserAttestation(undefined);
      await judgeMutation.mutateAsync({ chainId, logId, isValid, shouldRevoke: true });
      void onAttestationAffirmationRevoked?.();
    } catch {
      setOptimisticValidCount(validAttestations);
      setOptimisticInvalidCount(invalidAttestations);
      setOptimisticUserAttested(userAttested);
      setOptimisticUserAttestation(userAttestation);
    }
  };

  const vote = async (isValid: boolean) => {
    if ((disabled ?? false) || isExpired) return;
    if (!sessionData?.user?.address) {
      toast.error("You must login to judge dogs!");
      return;
    }
    setBusy(isValid ? "valid" : "invalid");
    setStreak(isValid ? "valid" : "invalid");
    setTimeout(() => setStreak(null), 350);

    // Toggle off if re-voting the same way.
    if (effectiveUserAttested && effectiveUserAttestation === isValid) {
      await revoke(isValid);
      setBusy(null);
      return;
    }
    try {
      await judgeMutation.mutateAsync({ chainId, logId, isValid, shouldRevoke: false });
    } finally {
      setBusy(null);
    }
  };

  const votedValid = effectiveUserAttested && effectiveUserAttestation === true;
  const votedSus = effectiveUserAttested && effectiveUserAttestation === false;
  const locked = (disabled ?? false) || busy !== null;

  return (
    <div className="w-full">
      <Portal>
        {isInsufficientStake && (
          <InsufficientStake isOpen={isInsufficientStake} onClose={() => setIsInsufficientStake(false)} />
        )}
      </Portal>
      {pendingTransactionId && (
        <TransactionStatus
          transactionId={pendingTransactionId}
          loadingMessages={[
            { message: "Casting your verdict...", duration: 2000 },
            { message: "Confirming on blockchain...", duration: 3000 },
            { message: "Almost done...", duration: 2000 },
          ]}
          successMessage="Verdict confirmed!"
          onResolved={(success, transactionHash) => {
            setPendingTransactionId(null);
            if (success) {
              void (async () => {
                try {
                  if (transactionHash) {
                    await refreshFeed({ chainId, transactionHash });
                  }
                } catch (error) {
                  console.warn("Could not refresh indexed votes after verdict", error);
                }
                if (sessionData?.user?.address) {
                  await utils.hotdog.getUserVotes.invalidate({ voter: sessionData.user.address });
                }
                await utils.hotdog.getJudges.invalidate();
                void onAttestationMade?.();
              })();
            }
          }}
        />
      )}

      {!isExpired && (
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
      )}

      {/* Fat ink-outlined tally meter with an oversized percentage. */}
      <div className={`flex items-center gap-3 ${isExpired ? "" : "mt-3"}`}>
        <div className="pop-frame relative h-6 flex-1 overflow-hidden rounded-full bg-error/25">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
        </div>
        <span className="font-display text-2xl leading-none tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1 flex justify-between font-display text-xs tracking-wide">
        <span className="text-accent">🥬 {valid} VALID</span>
        {(votedValid || votedSus) && (
          <span className="opacity-70">you voted {votedValid ? "VALID" : "SUS"}</span>
        )}
        <span className="text-error">{invalid} SUS 🔴</span>
      </div>
    </div>
  );
};

export default VoteBar;

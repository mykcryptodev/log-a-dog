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

// The redesigned heart of the card: a primary, full-width vote control.
// Two big buttons (VALID DOG / SUS), an animated valid/sus percentage bar, and
// a condiment streak that wipes across on tap. Reuses the same on-chain
// `hotdog.judge` mutation + optimistic logic as the legacy JudgeAttestation.
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
  const effectiveUserAttested = ghostVote ?? optimisticUserAttested;
  const effectiveUserAttestation = ghostVote ?? optimisticUserAttestation;

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
                  await utils.ghost.getUserVotes.invalidate({ voter: sessionData.user.address });
                }
                await utils.ghost.getJudges.invalidate();
                void onAttestationMade?.();
              })();
            }
          }}
        />
      )}

      {!isExpired && (
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
            disabled={locked}
            onClick={() => void vote(true)}
            className={`btn relative flex-1 overflow-hidden font-display tracking-wide ${
              votedValid ? "btn-accent" : "btn-outline btn-accent"
            }`}
          >
            <AnimatePresence>
              {streak === "valid" && (
                <motion.span
                  initial={{ x: "-110%" }}
                  animate={{ x: "110%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 bg-primary/60"
                />
              )}
            </AnimatePresence>
            <span className="relative">🥬 VALID DOG</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
            disabled={locked}
            onClick={() => void vote(false)}
            className={`btn relative flex-1 overflow-hidden font-display tracking-wide ${
              votedSus ? "btn-error" : "btn-outline btn-error"
            }`}
          >
            <AnimatePresence>
              {streak === "invalid" && (
                <motion.span
                  initial={{ x: "-110%" }}
                  animate={{ x: "110%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 bg-secondary/60"
                />
              )}
            </AnimatePresence>
            <span className="relative">🔴 SUS</span>
          </motion.button>
        </div>
      )}

      <div className={`h-3 w-full overflow-hidden rounded-full bg-error/30 ${isExpired ? "" : "mt-2"}`}>
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
      <p className="mt-1 text-center text-xs opacity-70">
        {pct}% valid · {total} verdict{total === 1 ? "" : "s"}
      </p>
    </div>
  );
};

export default VoteBar;

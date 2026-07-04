import { useEffect, useState, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-toastify";
import { getContract, sendTransaction, waitForReceipt } from "thirdweb";
import { useActiveWallet } from "thirdweb/react";
import { sendCalls, getCapabilities } from "thirdweb/wallets/eip5792";
import { api } from "~/utils/api";
import { client } from "~/providers/Thirdweb";
import { ATTESTATION_MANAGER } from "~/constants/addresses";
import { SUPPORTED_CHAINS } from "~/constants/chains";
import { attestToLog } from "~/thirdweb/84532/0xe8c7efdb27480dafe18d49309f4a5e72bdb917d9";
import { DATA_SUFFIX, withBuilderCode } from "~/constants/builderCode";
import { InsufficientStake } from "../Stake/InsufficientStake";
import { Portal } from "../utils/Portal";
import { useGhostVote } from "~/hooks/useGhostVote";
import { useVoterAddress } from "~/hooks/useVoterAddress";

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
// voting window is open. Votes are sent from the user's wallet via `attestToLog`;
// the locked banner only appears once the tx confirms on-chain.
export const VoteBar: FC<Props> = ({
  logId,
  chainId,
  disabled,
  isExpired = false,
  userAttested,
  userAttestation,
  onAttestationMade,
}) => {
  const voterAddress = useVoterAddress();
  const wallet = useActiveWallet();
  const utils = api.useUtils();
  const { mutateAsync: refreshFeed } = api.indexer.refreshFeed.useMutation();
  const [confirmedVote, setConfirmedVote] = useState<boolean | null>(() => {
    if (userAttested) return userAttestation ?? false;
    return null;
  });
  const [isInsufficientStake, setIsInsufficientStake] = useState(false);
  const [busy, setBusy] = useState<null | "valid" | "invalid">(null);
  const [streak, setStreak] = useState<null | "valid" | "invalid">(null);

  const ghostVote = useGhostVote(logId, voterAddress);

  // Only treat a vote as locked once it is confirmed on-chain (indexed vote,
  // server props, or a tx that mined successfully — never optimistically).
  useEffect(() => {
    if (ghostVote !== null) {
      setConfirmedVote(ghostVote);
      return;
    }
    if (userAttested) {
      setConfirmedVote(userAttestation ?? false);
    }
  }, [ghostVote, userAttested, userAttestation]);

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
          // Builder Code attribution on the outer userOp (EIP-5792). Optional so
          // wallets that don't support it just ignore it instead of failing.
          dataSuffix: { value: DATA_SUFFIX, optional: true },
        },
      });
    } else {
      const result = await sendTransaction({ account, transaction: await withBuilderCode(transaction) });
      await waitForReceipt({ client, chain, transactionHash: result.transactionHash });
    }
  };

  // Bust every read that feeds the voted/locked state. getById (dog page) is
  // Redis-cached per-user and would otherwise serve a stale `userAttested`,
  // leaving the buttons unlocked and re-votes reverting on-chain.
  const invalidateVoteState = async () => {
    const voter = voterAddress;
    await Promise.all([
      voter ? utils.hotdog.getUserVotes.invalidate({ voter }) : Promise.resolve(),
      utils.hotdog.getJudges.invalidate(),
      utils.hotdog.getById.invalidate({ logId }),
    ]);
  };

  const vote = async (isValid: boolean) => {
    if ((disabled ?? false) || isExpired) return;
    if (!voterAddress || !wallet) {
      toast.error("You must login to judge dogs!");
      return;
    }
    // The contract has no revoke; re-voting the same way is a no-op on-chain.
    if (confirmedVote !== null && confirmedVote === isValid) {
      return;
    }

    setBusy(isValid ? "valid" : "invalid");
    setStreak(isValid ? "valid" : "invalid");
    setTimeout(() => setStreak(null), 350);

    try {
      await submitVote(isValid);
      setConfirmedVote(isValid);
      toast.success("Verdict cast!");
      try {
        await refreshFeed({ chainId });
      } catch (error) {
        // The CDP-backed indexer can be down (e.g. 401); the vote is already
        // on-chain, so don't surface this to the user — the on-chain reads
        // below still reflect the verdict.
        console.warn("Could not refresh indexed votes after verdict", error);
      }
      await invalidateVoteState();
      void onAttestationMade?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // The contract reverts if you've already attested to this log. That means
      // our local state was stale (e.g. a cached getById), not a real failure —
      // the vote is already on-chain; lock the buttons and refresh truth.
      if (/already attested/i.test(message)) {
        setConfirmedVote(isValid);
        await invalidateVoteState();
        void onAttestationMade?.();
        return;
      }
      if (message.includes("Insufficient stake")) {
        setIsInsufficientStake(true);
      } else {
        toast.error(`Operation failed: ${message}`);
      }
    } finally {
      setBusy(null);
    }
  };

  const hasConfirmedVote = confirmedVote !== null;
  const votedValid = hasConfirmedVote && confirmedVote === true;
  const votedSus = hasConfirmedVote && confirmedVote === false;
  // Attestations are final on-chain (the contract has no revoke/update and
  // reverts on a second attest), so once confirmed the buttons lock.
  const locked = (disabled ?? false) || busy !== null || hasConfirmedVote;

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

  // After a confirmed vote, the un-chosen side dims and goes flat so it's
  // obvious the verdict is locked; the chosen side stays solid with a ✓ marker.
  const validBtnClass = hasConfirmedVote
    ? votedValid
      ? "bg-accent ring-2 ring-accent ring-offset-1 ring-offset-base-100"
      : "bg-accent/20 text-accent-content/40 grayscale"
    : "bg-accent/85";
  const susBtnClass = hasConfirmedVote
    ? votedSus
      ? "bg-error ring-2 ring-error ring-offset-1 ring-offset-base-100"
      : "bg-error/20 text-white/40 grayscale"
    : "bg-error/85";

  return (
    <div className="w-full">
      <Portal>
        {isInsufficientStake && (
          <InsufficientStake isOpen={isInsufficientStake} onClose={() => setIsInsufficientStake(false)} />
        )}
      </Portal>

      {hasConfirmedVote && (
        <div className="mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-base-200/70 py-1 font-display text-xs tracking-wide opacity-80">
          ✓ you voted {votedValid ? "VALID DOG" : "SUS"} — verdict locked
        </div>
      )}

      <div className="flex gap-3">
        <motion.button
          whileTap={locked ? undefined : { scale: 0.95 }}
          disabled={locked}
          onClick={() => void vote(true)}
          className={`pop-btn relative flex-1 overflow-hidden rounded-xl py-3 font-display text-sm tracking-wide text-accent-content ${validBtnClass} ${
            locked ? "cursor-default" : ""
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
          whileTap={locked ? undefined : { scale: 0.95 }}
          disabled={locked}
          onClick={() => void vote(false)}
          className={`pop-btn relative flex-1 overflow-hidden rounded-xl py-3 font-display text-sm tracking-wide text-white ${susBtnClass} ${
            locked ? "cursor-default" : ""
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

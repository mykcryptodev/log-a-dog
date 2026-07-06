import { useRef, useState, type FC } from "react";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import HotdogCard from "~/components/utils/HotdogCard";
import { type VoteBarHandle } from "~/components/Attestation/VoteBar";

const SWIPE_THRESHOLD = 100;

type HotdogData = Parameters<typeof HotdogCard>[0]["hotdog"];

type Props = {
  hotdog: HotdogData;
  chainId: number;
  validAttestations: string;
  invalidAttestations: string;
  userAttested: boolean;
  userAttestation: boolean;
  queuePosition: number;
  queueLength: number;
  onRefetch: () => void;
  onVoteSuccess: (logId: string) => void;
  onSkip: () => void;
};

export const SwipeableJudgeDeck: FC<Props> = ({
  hotdog,
  chainId,
  validAttestations,
  invalidAttestations,
  userAttested,
  userAttestation,
  queuePosition,
  queueLength,
  onRefetch,
  onVoteSuccess,
  onSkip,
}) => {
  const voteBarRef = useRef<VoteBarHandle>(null);
  const [isVoting, setIsVoting] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-8, 0, 8]);
  const validStampOpacity = useTransform(x, [0, 50, SWIPE_THRESHOLD], [0, 0.35, 1]);
  const susStampOpacity = useTransform(x, [-SWIPE_THRESHOLD, -50, 0], [1, 0.35, 0]);

  const handleVoteSuccess = () => {
    onVoteSuccess(hotdog.logId);
    onRefetch();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isVoting) {
      void animate(x, 0, { type: "spring", stiffness: 400, damping: 32 });
      return;
    }

    if (info.offset.x > SWIPE_THRESHOLD) {
      void voteBarRef.current?.vote(true);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      void voteBarRef.current?.vote(false);
    }

    void animate(x, 0, { type: "spring", stiffness: 400, damping: 32 });
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-sm opacity-70">
        <span>
          Dog {queuePosition} of {queueLength} awaiting verdict
        </span>
        {queueLength > 1 && (
          <button
            type="button"
            className="pop-btn rounded-lg bg-base-100 px-3 py-1 font-display text-sm tracking-wide"
            onClick={onSkip}
          >
            Skip →
          </button>
        )}
      </div>

      <div className="relative touch-pan-y">
        <motion.div
          drag={isVoting ? false : "x"}
          dragElastic={0.85}
          dragMomentum={false}
          style={{ x, rotate }}
          onDragEnd={handleDragEnd}
          className="relative cursor-grab active:cursor-grabbing"
        >
          <HotdogCard
            hotdog={hotdog}
            validAttestations={validAttestations}
            invalidAttestations={invalidAttestations}
            userAttested={userAttested}
            userAttestation={userAttestation}
            chainId={chainId}
            onRefetch={handleVoteSuccess}
            linkToDetail={false}
            showAiJudgement
            animateEntrance={false}
            voteBarRef={voteBarRef}
            onVoteBusyChange={setIsVoting}
          />

          {/* Swipe verdict stamps — mirror the mobile judge deck */}
          <motion.span
            aria-hidden
            style={{ opacity: validStampOpacity }}
            className="pointer-events-none absolute left-6 top-24 z-10 -rotate-12 rounded-xl border-2 border-base-content bg-accent px-3 py-1.5 font-display text-2xl tracking-widest text-accent-content"
          >
            VALID
          </motion.span>
          <motion.span
            aria-hidden
            style={{ opacity: susStampOpacity }}
            className="pointer-events-none absolute right-6 top-24 z-10 rotate-12 rounded-xl border-2 border-base-content bg-error px-3 py-1.5 font-display text-2xl tracking-widest text-white"
          >
            SUS
          </motion.span>

          {isVoting && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[1.75rem] bg-black/40">
              <div className="loading loading-spinner loading-lg text-white" />
              <span className="mt-2 font-display text-sm tracking-wide text-white">
                Casting verdict…
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <p className="mt-3 text-center text-xs opacity-50">
        Swipe right for VALID · swipe left for SUS · or tap the buttons below
      </p>
    </div>
  );
};

export default SwipeableJudgeDeck;

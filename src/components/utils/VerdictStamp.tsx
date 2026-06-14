import { motion } from "motion/react";

// The verdict "stamp" that slams onto the photo once a submission resolves.
// VALID DOG = relish (accent), SUS = sus red (error).
export function VerdictStamp({ valid }: { valid: boolean }) {
  return (
    <motion.div
      initial={{ scale: 1.4, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -12, x: [0, 2, -1, 0] }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 14,
        // spring only supports two keyframes, so the multi-keyframe shake on x
        // needs its own tween. See motion.dev/troubleshooting/spring-two-frames
        x: { type: "tween", duration: 0.3, ease: "easeOut" },
      }}
      className={`pointer-events-none absolute left-4 top-4 rounded-xl border-4 bg-base-100/70 px-3 py-1 font-display text-2xl tracking-wider backdrop-blur-sm ${
        valid ? "border-accent text-accent" : "border-error text-error"
      }`}
    >
      {valid ? "VALID DOG" : "SUS"}
    </motion.div>
  );
}

export default VerdictStamp;

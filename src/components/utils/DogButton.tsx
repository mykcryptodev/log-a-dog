import { motion } from "motion/react";
import { type ComponentProps } from "react";

// Primary "bun bounce" button: squash on tap, springy overshoot back.
// Respects prefers-reduced-motion via the global <MotionConfig> in _app.
export function DogButton({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 12 }}
      className={`btn btn-primary font-display tracking-wide ${className}`}
      {...(props as ComponentProps<typeof motion.button>)}
    />
  );
}

export default DogButton;

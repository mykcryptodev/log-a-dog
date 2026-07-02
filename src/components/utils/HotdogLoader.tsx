import { type FC } from "react";

type Props = {
  /** Font size of the hotdog glyph, in px. */
  size?: number;
  /** Optional caption next to / under the hotdog. */
  label?: string;
  /** Stack the label under the glyph instead of beside it. */
  vertical?: boolean;
  className?: string;
};

// Branded loading indicator: a hotdog rocking side to side like it's rolling
// on the grill. Web counterpart of the native HotdogLoader — use it instead
// of the generic daisyUI spinner for section/page-level loading states.
// `motion-safe:` keeps it static when the OS asks for reduced motion.
export const HotdogLoader: FC<Props> = ({
  size = 32,
  label,
  vertical = false,
  className = "",
}) => (
  <div
    role="status"
    aria-label={label ?? "Loading"}
    className={`flex items-center justify-center gap-2 ${
      vertical ? "flex-col" : ""
    } ${className}`}
  >
    <span
      aria-hidden
      className="inline-block motion-safe:animate-dog-rock"
      style={{ fontSize: size, lineHeight: 1.25 }}
    >
      🌭
    </span>
    {label && <span className="text-sm text-base-content/70">{label}</span>}
  </div>
);

export default HotdogLoader;

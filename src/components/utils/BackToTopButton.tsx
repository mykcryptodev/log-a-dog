import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/outline";

type Props = {
  targetId?: string;
  /** Minimum scroll depth before the button can appear. */
  threshold?: number;
  /** Upward scroll distance required to reveal the button. */
  scrollUpDelta?: number;
};

export const BackToTopButton: FC<Props> = ({
  targetId = "top-of-list",
  threshold = 400,
  scrollUpDelta = 40,
}) => {
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = lastScrollY.current - currentY;

      if (currentY <= threshold) {
        setVisible(false);
      } else if (delta >= scrollUpDelta) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        setVisible(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, scrollUpDelta]);

  const scrollToTop = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [targetId]);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`btn btn-primary btn-sm fixed left-1/2 top-12 z-50 -translate-x-1/2 gap-1 rounded-full px-4 font-display tracking-wide shadow-dog transition-all duration-200 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <ChevronUpIcon className="h-4 w-4" />
      Back to top
    </button>
  );
};

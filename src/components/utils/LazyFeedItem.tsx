import { useEffect, useRef, useState, type FC, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /**
   * How far outside the viewport an item stays mounted. Larger = smoother
   * scrolling (content is ready earlier), smaller = lower memory ceiling.
   */
  rootMargin?: string;
  /**
   * Placeholder height used before the item has ever been measured. Only
   * matters for items that start far below the viewport, and the observer
   * corrects it as soon as the real content mounts.
   */
  estimatedHeight?: number;
};

/**
 * Windowing wrapper for infinite-feed items. Feed cards are heavy (full-size
 * media, portal modals, polling intervals, wallet-balance hooks), so keeping
 * every loaded page mounted grows memory without bound and eventually crashes
 * the tab. This mounts children only while they are within `rootMargin` of the
 * viewport; once they scroll far enough away they unmount, leaving a
 * placeholder of the last measured height so scroll position never jumps.
 */
export const LazyFeedItem: FC<Props> = ({
  children,
  rootMargin = "1200px 0px",
  estimatedHeight = 820,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastHeightRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer support (very old browsers): render everything.
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          // Capture the rendered height before unmounting so the placeholder
          // keeps the page geometry (and scroll position) intact.
          const height = entry.boundingClientRect.height;
          if (height > 0) lastHeightRef.current = height;
          setVisible(false);
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={containerRef}
      style={
        visible
          ? undefined
          : { height: lastHeightRef.current ?? estimatedHeight }
      }
    >
      {visible ? children : null}
    </div>
  );
};

export default LazyFeedItem;

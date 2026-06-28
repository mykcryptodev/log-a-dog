import { useState, useEffect } from "react";
import useMounted from "~/hooks/useMounted";
import { getSeasonInfo } from "~/helpers/season";

const STORAGE_KEY = "preseason-banner-dismissed";

export function PreseasonBanner() {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(true);
  const { isLive } = getSeasonInfo();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  if (!mounted || isLive || dismissed) return null;

  return (
    <div className="relative border-b-[3px] border-base-content bg-primary px-4 py-3 text-primary-content">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <p className="font-display text-sm tracking-wide">
          🌭 <strong>PRE-SEASON:</strong> Competition kicks off{" "}
          <strong>July 4th</strong>
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="shrink-0 text-primary-content/70 hover:text-primary-content"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

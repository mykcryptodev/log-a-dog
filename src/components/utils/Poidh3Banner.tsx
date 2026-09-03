import { useState, useEffect } from "react";
import Link from "next/link";
import useMounted from "~/hooks/useMounted";
import { isPoidh3CampaignLive } from "~/utils/poidh3";

const STORAGE_KEY = "poidh-3-banner-dismissed";

export function Poidh3Banner() {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    }
  }, []);

  const handleDismiss = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  if (!mounted || dismissed || !isPoidh3CampaignLive()) return null;

  return (
    <Link
      href="/poidh-3"
      className="relative block border-b-[3px] border-base-content bg-secondary px-4 py-3 text-secondary-content transition-opacity hover:opacity-95"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <p className="font-display text-sm tracking-wide">
          🕹️ <strong>POIDH Labor Day</strong> · Sept 4–7 · Win $50 ETH/day →
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="shrink-0 text-secondary-content/70 hover:text-secondary-content"
        >
          ✕
        </button>
      </div>
    </Link>
  );
}

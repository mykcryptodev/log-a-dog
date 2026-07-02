import { useState, useEffect } from "react";
import Link from "next/link";
import useMounted from "~/hooks/useMounted";

const STORAGE_KEY = "poidh-banner-dismissed";

export function PoidhBanner() {
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

  if (!mounted || dismissed) return null;

  return (
    <Link
      href="/poidh"
      className="relative block border-b-[3px] border-base-content bg-primary px-4 py-3 text-primary-content transition-opacity hover:opacity-95"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <p className="font-display text-sm tracking-wide">
          🕹️ <strong>POIDH Campaign</strong> · Win $50 ETH/day →
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="shrink-0 text-primary-content/70 hover:text-primary-content"
        >
          ✕
        </button>
      </div>
    </Link>
  );
}

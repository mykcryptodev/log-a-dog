import { type FC, type ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { ToastProvider } from "~/providers/Toast";
import useMounted from "~/hooks/useMounted";
import { getSeasonInfo } from "~/helpers/season";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  // Compute on the client to avoid a hydration mismatch on the day counter.
  const mounted = useMounted();
  const { season, day, isLive } = getSeasonInfo();

  return (
    <div className="app-bg block min-h-screen">
      <div className="mx-auto min-h-screen max-w-7xl overflow-x-hidden pb-24">
        {/* Slim sticky scoreboard header — brand left, season/day right. */}
        <header className="sticky top-0 z-40 border-b border-base-content/10 bg-base-100/70 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
            <Link href="/" className="flex items-center gap-1.5 font-display tracking-wide">
              <span className="text-xl">🌭</span>
              <span className="text-lg leading-none">LOG A DOG</span>
            </Link>
            <div className="flex items-center gap-2 font-display text-xs tracking-wider">
              <Link
                href="/rules"
                aria-label="How it works"
                className="rounded-full bg-base-200 px-2.5 py-1"
              >
                ?
              </Link>
              <span className="rounded-full bg-base-200 px-2.5 py-1">
                SEASON {season}
              </span>
              {mounted && (
                <span className="rounded-full bg-primary/20 px-2.5 py-1 text-primary">
                  {isLive ? `DAY ${day}` : "OFFSEASON"}
                </span>
              )}
            </div>
          </div>
        </header>

        <ToastProvider />
        {children}
        <BottomNav />
      </div>
    </div>
  );
};

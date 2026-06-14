import { type FC, type ReactNode } from "react";
import Image from "next/image";
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
  const { day, isLive } = getSeasonInfo();

  return (
    <div className="app-bg block min-h-screen">
      <div className="mx-auto min-h-screen max-w-7xl overflow-x-hidden pb-24">
        {/* Slim sticky scoreboard header — brand left, season/day right. */}
        <header className="sticky top-0 z-40 border-b border-base-content/10 bg-base-100/70 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/images/lockup.png"
                alt="Log a Dog"
                width={962}
                height={240}
                className="h-8 w-auto dark:hidden"
                priority
              />
              <Image
                src="/images/lockup-dark.png"
                alt="Log a Dog"
                width={961}
                height={233}
                className="hidden h-8 w-auto dark:block"
                priority
              />
            </Link>
            <div className="flex items-center gap-2 font-display text-xs tracking-wider">
              <Link
                href="/rules"
                className="rounded-full bg-base-200 px-2.5 py-1"
              >
                RULES
              </Link>
              <Link
                href="/earn"
                className="rounded-full bg-base-200 px-2.5 py-1"
              >
                $HOTDOG
              </Link>
              {mounted && (
                <span className="rounded-full bg-primary/20 px-2.5 py-1 text-primary">
                  {isLive ? `DAY ${day}` : "PRE-SEASON"}
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

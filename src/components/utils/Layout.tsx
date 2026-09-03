import { type FC, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { ToastProvider } from "~/providers/Toast";
import useMounted from "~/hooks/useMounted";
import { getSeasonInfo } from "~/helpers/season";
import { PoidhBanner } from "./PoidhBanner";
import { Poidh2Banner } from "./Poidh2Banner";
import { Poidh3Banner } from "./Poidh3Banner";
import { isPoidhCampaignLive } from "~/utils/poidh";
import { isPoidh2CampaignLive } from "~/utils/poidh2";
import { isPoidh3CampaignLive } from "~/utils/poidh3";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  // Compute on the client to avoid a hydration mismatch on the day counter.
  const mounted = useMounted();
  const { day, isLive } = getSeasonInfo();
  const poidh3Live = isPoidh3CampaignLive();
  // Round three takes over the header slot and banner while it's running.
  const poidh2Live = isPoidh2CampaignLive() && !poidh3Live;
  const poidhLive = isPoidhCampaignLive() && !poidh3Live && !poidh2Live;
  const anyPoidhLive = poidhLive || poidh2Live || poidh3Live;

  return (
    <div className="app-bg block min-h-screen">
      <div className="mx-auto min-h-screen max-w-7xl overflow-x-hidden pb-24">
        {/* Slim sticky scoreboard header — brand left, season/day right. */}
        <header className="sticky top-0 z-40 border-b-[3px] border-base-content bg-base-100">
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
                className="rounded-full border-2 border-base-content bg-base-200 px-2.5 py-1"
              >
                RULES
              </Link>
              <Link
                href="/earn"
                className="rounded-full border-2 border-base-content bg-base-200 px-2.5 py-1"
              >
                $HOTDOG
              </Link>
              {anyPoidhLive && (
                <Link
                  href={poidh3Live ? "/poidh-3" : poidh2Live ? "/poidh-2" : "/poidh"}
                  className="rounded-full border-2 border-base-content bg-secondary px-2.5 py-1 text-secondary-content"
                >
                  POIDH
                </Link>
              )}
              {mounted && isLive && !anyPoidhLive && (
                <span className="shrink-0 whitespace-nowrap rounded-full border-2 border-base-content bg-primary px-2.5 py-1 text-primary-content">
                  DAY {day}
                </span>
              )}
            </div>
          </div>
        </header>

        {poidh3Live && <Poidh3Banner />}
        {poidh2Live && <Poidh2Banner />}
        {poidhLive && <PoidhBanner />}
        <ToastProvider />
        {children}
        <BottomNav />
      </div>
    </div>
  );
};

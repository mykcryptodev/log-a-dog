import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useContext } from "react";
import {
  CameraIcon,
  ShareIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { FarcasterContext } from "~/providers/Farcaster";
import { openMiniApp } from "~/utils/farcasterSdk";
import {
  POIDH2_BOUNTY_URL,
  POIDH2_CAMPAIGN_DAYS,
  POIDH2_PRIZE_USD,
  POIDH2_WINNER_COUNT,
} from "~/utils/poidh2";

const STEPS = [
  {
    emoji: "🌭",
    title: "Eat a hotdog",
    body: "It must be a real dog — 4.8+ inches, in a bun.",
    icon: null,
  },
  {
    emoji: "📷",
    title: "Snap the proof",
    body: "Photograph yourself actively mid-bite. The camera needs to catch you in the act.",
    icon: CameraIcon,
  },
  {
    emoji: "⬆️",
    title: "Log it onchain",
    body: "Upload your photo on Log a Dog. Your submission gets recorded on Base.",
    icon: null,
  },
  {
    emoji: "📢",
    title: "Share on Farcaster or X",
    body: "Post your logged submission publicly. Copy the link — you'll need it next.",
    icon: ShareIcon,
  },
  {
    emoji: "🕹️",
    title: "Submit your claim on POIDH",
    body: "Paste your social post link as a bounty claim at poidh.xyz. That's your entry.",
    icon: null,
  },
];

const WINNING_CRITERIA = [
  { label: "Creative presentation", emoji: "🎨" },
  { label: "Humor", emoji: "😂" },
  { label: "Photographic quality", emoji: "📸" },
  { label: "Originality", emoji: "✨" },
];

const Poidh2Page: NextPage = () => {
  const farcaster = useContext(FarcasterContext);
  const isMiniApp = farcaster?.isMiniApp ?? false;

  const openPoidh = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isMiniApp) return;

      e.preventDefault();
      try {
        await openMiniApp(POIDH2_BOUNTY_URL);
      } catch (err) {
        console.error("Failed to open POIDH mini app", err);
        window.open(POIDH2_BOUNTY_URL, "_blank");
      }
    },
    [isMiniApp],
  );

  return (
    <>
      <Head>
        <title>POIDH × Log a Dog — August 14–16 Daily Winners</title>
        <meta
          name="description"
          content={`Win $${POIDH2_PRIZE_USD} ETH a day, August 14–16. One winner every day — log a hotdog, share it, claim your prize on POIDH.`}
        />
        <link rel="icon" href="/favicon.ico" />
        <meta key="ogimage" property="og:image" content="https://www.logadog.xyz/images/og-image.png" />
        <meta key="twimage" name="twitter:image" content="https://www.logadog.xyz/images/og-image.png" />
      </Head>
      <main className="flex flex-col items-center px-4 pt-6 pb-10">
        <div className="flex w-full max-w-xl flex-col gap-5">

          {/* Hero */}
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-3 font-display text-5xl">
              🌭 <span className="text-base-content/40">×</span> 🕹️
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              POIDH <span className="text-secondary">ROUND 2</span>
            </h1>
            <p className="mt-2 text-sm opacity-70">
              Log a Dog meets &quot;Pics or it didn&apos;t happen&quot; — all weekend long
            </p>
          </div>

          {/* Date + Prize banner */}
          <div className="pop-card rounded-3xl bg-secondary p-5 text-secondary-content">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-xs tracking-widest opacity-80">AUGUST 14 – 16, 2026</p>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  FRI. SAT. SUN. {POIDH2_WINNER_COUNT} WINNERS.
                </h2>
                <p className="mt-1 text-sm opacity-80">
                  One winner picked per day by the organizers.
                </p>
                <a
                  href={POIDH2_BOUNTY_URL}
                  target={isMiniApp ? undefined : "_blank"}
                  rel={isMiniApp ? undefined : "noopener noreferrer"}
                  onClick={openPoidh}
                  className="mt-2 inline-block text-sm font-semibold underline underline-offset-2 opacity-90 hover:opacity-100"
                >
                  View bounty on POIDH →
                </a>
              </div>
              <div className="shrink-0 text-center">
                <div className="font-display text-4xl font-bold">${POIDH2_PRIZE_USD}</div>
                <div className="font-display text-xs tracking-widest opacity-80">ETH / DAY</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {POIDH2_CAMPAIGN_DAYS.map((day) => (
                <div
                  key={day.date}
                  className="rounded-2xl bg-secondary-content/15 px-2 py-2 text-center"
                >
                  <div className="font-display text-xs tracking-widest opacity-80">
                    {day.label.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold">{day.date}</div>
                  <div className="text-xs opacity-80">1 winner</div>
                </div>
              ))}
            </div>
          </div>

          {/* What is POIDH */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">🕹️ WHAT IS POIDH?</h2>
            <p className="text-sm text-base-content/80 leading-relaxed">
              <strong>POIDH</strong> stands for <strong>&quot;Pics or it didn&apos;t happen&quot;</strong> — a
              decentralized bounty protocol where community voting validates photo proof claims
              and awards prizes. For this campaign, POIDH is the prize layer on top of Log a Dog.
            </p>
            <div className="mt-3 rounded-2xl bg-base-200 p-3 text-sm text-base-content/70">
              Log a Dog handles the onchain proof. POIDH handles the bounty payout. Together
              they make a fully verifiable hotdog competition with real ETH on the line.
            </div>
          </div>

          {/* How to participate */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">🎯 HOW TO PARTICIPATE</h2>
            <div className="space-y-4">
              {STEPS.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="badge badge-primary badge-lg shrink-0">{idx + 1}</div>
                  <div>
                    <h3 className="font-semibold">
                      {step.emoji} {step.title}
                    </h3>
                    <p className="text-sm text-base-content/70">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Winning criteria */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-1 font-display text-2xl font-bold tracking-tight">🏆 WINNING CRITERIA</h2>
            <p className="mb-4 text-sm opacity-70">
              Organizers judge each day&apos;s entries on these dimensions:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WINNING_CRITERIA.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-2 rounded-2xl bg-base-200 px-3 py-2.5"
                >
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-sm font-semibold">{c.label}</span>
                </div>
              ))}
            </div>
            <div className="alert mt-4 rounded-2xl bg-primary/15 border-0">
              <StarIcon className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm font-semibold">
                Quality beats quantity — one great submission is all it takes.
              </p>
            </div>
          </div>

          {/* Platform explainer */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">⚙️ TWO PLATFORMS</h2>
            <div className="space-y-3">
              <div className="rounded-2xl bg-base-200 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-2xl">🌭</span>
                  <h3 className="font-display font-bold tracking-wide">LOG A DOG</h3>
                </div>
                <p className="text-sm text-base-content/70">
                  Your hotdog photo becomes an onchain token on Base. Logged submissions are
                  tradeable — you earn trading fees when other players buy and sell your dog.
                </p>
              </div>
              <div className="rounded-2xl bg-base-200 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-2xl">🕹️</span>
                  <h3 className="font-display font-bold tracking-wide">POIDH</h3>
                </div>
                <p className="text-sm text-base-content/70">
                  A decentralized bounty protocol. Submit your social share link as a claim.
                  The community votes to validate it, and winners receive the ETH prize.
                </p>
              </div>
            </div>
          </div>

          {/* Requirements checklist */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">✅ ENTRY REQUIREMENTS</h2>
            <ul className="space-y-2">
              {[
                "Hotdog is 4.8+ inches long, served in a bun",
                "You are visibly mid-bite in the photo",
                "Submission is logged on logadog.xyz (onchain via Base)",
                "Logged submission is shared on Farcaster or X",
                "Social post link is submitted as a claim on poidh.xyz",
                "Entry lands on a campaign day — August 14, 15, or 16, 2026",
              ].map((req) => (
                <li key={req} className="flex items-start gap-2 text-sm">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="pop-btn flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-lg tracking-wide text-primary-content"
            >
              <CameraIcon className="h-5 w-5" />
              LOG YOUR DOG 🌭
            </Link>
            <a
              href={POIDH2_BOUNTY_URL}
              target={isMiniApp ? undefined : "_blank"}
              rel={isMiniApp ? undefined : "noopener noreferrer"}
              onClick={openPoidh}
              className="pop-btn flex items-center justify-center gap-2 rounded-2xl border-[3px] border-base-content bg-base-100 px-5 py-4 font-display tracking-wide"
            >
              <CurrencyDollarIcon className="h-5 w-5" />
              SUBMIT CLAIM ON POIDH 🕹️
            </a>
          </div>

          {/* Link back to the first campaign */}
          <Link
            href="/poidh"
            className="text-center text-xs font-semibold underline underline-offset-2 opacity-60 hover:opacity-100"
          >
            Missed round one? See the Fourth of July campaign →
          </Link>

          {/* Fine print */}
          <p className="text-center text-xs opacity-40">
            Campaign runs Friday–Sunday, August 14–16, 2026. One ${POIDH2_PRIZE_USD} ETH
            prize awarded per day. Winners selected by organizers based on quality and
            creativity.
          </p>

        </div>
      </main>
    </>
  );
};

export default Poidh2Page;

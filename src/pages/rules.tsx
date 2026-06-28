import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const CARDS = [
  { emoji: "🌭", title: "1. EAT A DOG", body: "Eat a hotdog. Any hotdog. The grill is always hot." },
  { emoji: "📷", title: "2. LOG IT", body: "Snap a pic of you eating it and log it onchain. Tap the 🌭 button." },
  { emoji: "🧑‍⚖️", title: "3. GET JUDGED", body: "Other players have 48 hours to rule your dog VALID or SUS." },
  { emoji: "🏆", title: "4. CLIMB THE BOARD", body: "Valid dogs count toward the leaderboard. Creative dogs get rewarded throughout the summer." },
];

const RulesPage: NextPage = () => {
  const [i, setI] = useState(0);
  const card = CARDS[i]!;
  const last = i === CARDS.length - 1;

  return (
    <>
      <Head>
        <title>How it works - Log a Dog</title>
        <meta name="description" content="The internet's summer hotdog-eating sport — the rules." />
      </Head>
      <main className="flex flex-col items-center px-4 pt-10">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <p className="text-center font-display text-xl tracking-wide opacity-70">
            The internet&apos;s summer hotdog-eating sport
          </p>

          <div className="relative h-72 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50 && i < CARDS.length - 1) setI((c) => c + 1);
                  if (info.offset.x > 50 && i > 0) setI((c) => c - 1);
                }}
                className="pop-card absolute inset-0 flex cursor-grab flex-col items-center justify-center gap-4 rounded-3xl bg-base-200 p-8 text-center active:cursor-grabbing"
              >
                <span className="text-6xl">{card.emoji}</span>
                <h2 className="font-display text-3xl tracking-wide">{card.title}</h2>
                <p className="font-bold opacity-80">{card.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            {CARDS.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to card ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${idx === i ? "bg-primary" : "bg-base-300"}`}
              />
            ))}
          </div>

          {last ? (
            <Link href="/" className="pop-btn rounded-xl bg-primary px-5 py-3 font-display tracking-wide text-primary-content">
              START LOGGING 🌭
            </Link>
          ) : (
            <button className="pop-btn rounded-xl bg-primary px-5 py-3 font-display tracking-wide text-primary-content" onClick={() => setI((c) => c + 1)}>
              NEXT →
            </button>
          )}

          <Link href="/faq" className="text-xs underline opacity-60">
            Read the full FAQ
          </Link>
        </div>
      </main>
    </>
  );
};

export default RulesPage;

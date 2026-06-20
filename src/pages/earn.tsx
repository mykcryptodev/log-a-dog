import { type NextPage } from "next";
import Head from "next/head";
import { Stake } from "~/components/Stake/Stake";
import ClaimRewards from "~/components/Stake/ClaimRewards";
import ClaimProtocolRewards from "~/components/Zora/ClaimProtocolRewards";
import { useState } from "react";
import {
  ShieldCheckIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  ClipboardIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Buy } from "~/components/utils/Buy";
import { HOTDOG_TOKEN, DEFAULT_CHAIN } from "~/constants";
import { AirdropChannel } from "~/components/Airdrop/Channel";
import Link from "next/link";
import RelevantHolders from "~/components/RelevantHolders";
import Image from "next/image";

const EarnPage: NextPage = () => {
  const [mode, setMode] = useState<"eat" | "judge">("judge");
  const [stakeTab, setStakeTab] = useState<"stake" | "claim">("stake");
  const hotdogAddress = HOTDOG_TOKEN[DEFAULT_CHAIN.id]!;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hotdogAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Earn $HOTDOG — Log a Dog</title>
        <meta name="description" content="Stake $HOTDOG, judge submissions, and earn rewards." />
      </Head>
      <main className="flex flex-col items-center px-4 pt-6">
        <div className="flex w-full max-w-xl flex-col gap-5">

          {/* Page header */}
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              💰 EARN <span className="text-secondary">$HOTDOG</span>
            </h1>
            <p className="mt-2 text-sm opacity-70">Stake, judge, and collect.</p>
          </div>

          {/* Token acquisition */}
          <div className="pop-card rounded-3xl bg-base-100 p-5 text-center">
            <p className="mb-3 text-sm opacity-70">Need some $HOTDOG?</p>
            <Buy />
            <div className="mt-3">
              <RelevantHolders />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-base-content/50">
              <span className="break-all font-mono text-[0.6rem]">{hotdogAddress}</span>
              <button
                aria-label="Copy contract address"
                onClick={handleCopy}
                className="btn btn-ghost btn-xs shrink-0 px-1"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-success" />
                ) : (
                  <ClipboardIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Staking */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <div role="tablist" className="tabs tabs-boxed mb-4 border-2 border-base-content bg-base-200">
              <a
                role="tab"
                className={`tab font-display tracking-wide ${stakeTab === "stake" ? "tab-active" : ""}`}
                onClick={() => setStakeTab("stake")}
              >
                Stake
              </a>
              <a
                role="tab"
                className={`tab font-display tracking-wide ${stakeTab === "claim" ? "tab-active" : ""}`}
                onClick={() => setStakeTab("claim")}
              >
                Claim Rewards
              </a>
            </div>
            {stakeTab === "stake" ? <Stake /> : <ClaimRewards />}
          </div>

          {/* How Earning Works */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">💡 HOW IT WORKS</h2>

            <Image
              src="/images/how.png"
              className="mb-4 h-auto w-full cursor-pointer rounded-2xl shadow transition-transform hover:scale-[1.02]"
              alt="How Earning Works"
              width={1000}
              height={1000}
              onClick={() => {
                (document.getElementById("how-earning-modal") as HTMLDialogElement | null)?.showModal();
              }}
            />
            <dialog id="how-earning-modal" className="modal">
              <form method="dialog" className="modal-box bg-transparent p-0 shadow-none" style={{ maxWidth: "48rem" }}>
                <Image
                  src="/images/how.png"
                  className="h-auto w-full rounded-2xl shadow-lg"
                  alt="How Earning Works"
                  width={1600}
                  height={1600}
                  priority
                />
                <button className="btn btn-circle btn-sm absolute right-2 top-2" type="submit" aria-label="Close">
                  ✕
                </button>
              </form>
              <form method="dialog" className="modal-backdrop">
                <button aria-label="Close" />
              </form>
            </dialog>

            <div role="tablist" className="tabs tabs-boxed mb-4 border-2 border-base-content bg-base-200">
              <a
                role="tab"
                className={`tab font-display tracking-wide ${mode === "eat" ? "tab-active" : ""}`}
                onClick={() => setMode("eat")}
              >
                Eat to Earn
              </a>
              <a
                role="tab"
                className={`tab font-display tracking-wide ${mode === "judge" ? "tab-active" : ""}`}
                onClick={() => setMode("judge")}
              >
                Judge to Earn
              </a>
            </div>

            {mode === "eat" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-lg shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold">Upload a pic</h3>
                    <p className="text-sm text-base-content/70">
                      Take a picture of you eating a hotdog as your proof
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-lg shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold">Earn rewards</h3>
                    <p className="text-sm text-base-content/70">
                      Your picture can be bought and sold by traders — you earn the trading fees!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-lg shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold">Stake $HOTDOG</h3>
                    <p className="text-sm text-base-content/70">
                      Stake your $HOTDOG tokens to participate in judging
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-lg shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold">Judge Submissions</h3>
                    <p className="text-sm text-base-content/70">
                      Vote on hotdog submissions to maintain quality and earn rewards
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-lg shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold">Earn Rewards</h3>
                    <p className="text-sm text-base-content/70">
                      Win rewards from incorrect voters and earn staking yields
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Judging Guidelines */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight">🧑‍⚖️ JUDGING RULES</h2>
              <Link href="/judges" className="pop-btn flex items-center gap-1 rounded-lg bg-base-100 px-3 py-1.5 font-display text-sm tracking-wide">
                <TrophyIcon className="h-4 w-4" />
                Judges
              </Link>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-error/10 p-3">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <HandThumbDownIcon className="h-4 w-4 text-error" />
                  Vote SUS if:
                </div>
                <ul className="space-y-1 pl-6 text-sm text-base-content/80">
                  <li>• Image is not someone eating a hotdog</li>
                  <li>• Submission is a duplicate entry</li>
                  <li>• Content violates competition spirit</li>
                  <li>• Image is inappropriate or spam</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-success/10 p-3">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <HandThumbUpIcon className="h-4 w-4 text-success" />
                  Vote VALID if:
                </div>
                <ul className="space-y-1 pl-6 text-sm text-base-content/80">
                  <li>• Person is clearly eating a hotdog</li>
                  <li>• Image is original and authentic</li>
                  <li>• Submission follows all guidelines</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Voting Process */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">⚡ VOTING PROCESS</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">Stake to Vote</h3>
                <p className="text-xs text-base-content/70">30,000 $HOTDOG minimum on your verdict</p>
              </div>
              <div>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                  <ClockIcon className="h-6 w-6 text-warning" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">48h Window</h3>
                <p className="text-xs text-base-content/70">Voting closes 48 hours after submission</p>
              </div>
              <div>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <TrophyIcon className="h-6 w-6 text-success" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">Majority Wins</h3>
                <p className="text-xs text-base-content/70">Winners split 15% from the losing side</p>
              </div>
            </div>
            <div className="divider" />
            <div className="rounded-2xl bg-info/10 p-3">
              <h4 className="mb-2 font-semibold text-info">💡 Pro Tips</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  • <strong>Stake more</strong> — higher stakes mean higher potential rewards
                </li>
                <li>
                  • <strong>Vote accurately</strong> — correct votes build your reputation
                </li>
                <li>
                  • <strong>Vote early</strong> — voting closes after 48 hours
                </li>
                <li>
                  • <strong>Stay active</strong> — regular participation maximizes earnings
                </li>
              </ul>
            </div>
          </div>

          {/* Claim Trading Rewards */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">🎁 TRADING REWARDS</h2>
            <ClaimProtocolRewards />
          </div>

          {/* Airdrop */}
          <div className="pop-card rounded-3xl bg-base-100 p-5">
            <h2 className="mb-1 font-display text-2xl font-bold tracking-tight">🪂 AIRDROP</h2>
            <p className="mb-3 text-sm opacity-70">
              3M $HOTDOG for Glizzy Zone and Log a Dog Channel followers
            </p>
            <div className="flex w-full flex-col items-center gap-2">
              <AirdropChannel />
            </div>
          </div>

          {/* Risk Warning */}
          <div className="alert alert-warning rounded-2xl">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
            <div>
              <h3 className="font-display tracking-wide">RISK NOTICE</h3>
              <p className="text-sm">
                Voting incorrectly results in losing 15% of your staked tokens to the winning side.
                Only vote if you&apos;re confident in your judgment.
              </p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default EarnPage;

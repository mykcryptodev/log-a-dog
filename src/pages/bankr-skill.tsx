import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";

const INSTALL_PROMPT = "Install this skill: https://mykclawd.xyz/api/skills/logadog";

const STEPS = [
  {
    title: "1. Open Bankr.",
    body: "Use a Bankr agent with a Base mainnet wallet. The skill is designed for HOTDOG balance checks, staking setup, and on-chain dog judging.",
  },
  {
    title: "2. Install the skill.",
    body: "Prompt Bankr with:",
    prompt: INSTALL_PROMPT,
  },
  {
    title: "3. Pick a dog to judge.",
    body: (
      <>
        Share a Log a Dog URL like{" "}
        <span className="font-semibold">https://www.logadog.xyz/dog/123</span> or tell Bankr the
        dog ID. Try:{" "}
        <span className="font-semibold">&quot;Judge dog 123 on Log a Dog as VALID DOG.&quot;</span>
      </>
    ),
  },
  {
    title: "4. Get $HOTDOG if needed.",
    body: "Ask Bankr to swap into HOTDOG on Base before judging if your wallet does not already have enough.",
  },
  {
    title: "5. Stake if needed.",
    body: "If you are not staked yet, Bankr can guide you through HOTDOG approval and staking before your vote goes through.",
  },
  {
    title: "6. Cast your verdict.",
    body: (
      <>
        Ask for a specific side, such as{" "}
        <span className="font-semibold">&quot;Vote VALID DOG on Log a Dog dog 123.&quot;</span> or{" "}
        <span className="font-semibold">&quot;Mark dog 456 as SUS.&quot;</span> Bankr should preview
        the action and route the vote through your connected wallet.
      </>
    ),
  },
] as const;

const BankrSkillPage: NextPage = () => {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <>
      <Head>
        <title>Bankr Skill - Log a Dog</title>
        <meta
          name="description"
          content="Use the Log a Dog Bankr skill to stake HOTDOG and vote VALID DOG or SUS on dog submissions."
        />
      </Head>
      <main className="flex flex-col items-center px-4 pt-6 pb-16">
        <div className="flex w-full max-w-xl flex-col gap-5">
          <Link
            href="/judges"
            className="btn btn-ghost btn-sm w-fit gap-1 rounded-xl pl-2 font-display tracking-wide"
          >
            <span aria-hidden="true">←</span>
            Back to Judge
          </Link>

          <article className="pop-card rounded-3xl bg-base-100">
            <div className="flex flex-col gap-8 p-5 sm:p-8">
              <section className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <Image
                  src="/images/bankr.jpg"
                  alt="Bankr Skill"
                  width={112}
                  height={112}
                  className="size-24 rounded-3xl object-cover shadow-lg sm:size-28"
                  priority
                />
                <div className="space-y-3">
                  <span className="badge badge-secondary font-display tracking-wide">Bankr Skill</span>
                  <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    Log a Dog Bankr Skill
                  </h1>
                  <p className="text-sm leading-relaxed opacity-70">
                    Use the Log a Dog skill with Bankr agents to check HOTDOG stake, set up voting,
                    and cast VALID DOG or SUS verdicts on dog submissions.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="font-display text-xl font-bold tracking-tight">How To Use It</h2>
                <ol className="space-y-3">
                  {STEPS.map((step) => (
                    <li key={step.title} className="rounded-2xl border-2 border-base-content bg-base-200/40 p-4">
                      <span className="font-bold">{step.title}</span>
                      <p className="mt-1 text-sm opacity-70">{step.body}</p>
                      {"prompt" in step && step.prompt && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-base-content bg-base-100 px-3 py-2 text-sm font-semibold">
                          <span className="min-w-0 flex-1 break-all">&quot;{step.prompt}&quot;</span>
                          <button
                            type="button"
                            aria-label="Copy install prompt"
                            className="btn btn-ghost btn-xs shrink-0 px-1"
                            onClick={() => void copyText(step.prompt)}
                          >
                            {copiedPrompt === step.prompt ? (
                              <CheckIcon className="h-4 w-4 text-success" />
                            ) : (
                              <ClipboardIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </section>

              <section className="rounded-2xl border-2 border-warning bg-warning/10 p-4 text-sm">
                <p className="font-bold">Privacy while voting is open</p>
                <p className="mt-1 opacity-80">
                  While a dog&apos;s 48-hour voting window is still active, do not ask Bankr to reveal
                  live vote totals or which side is ahead. You can ask whether your wallet has voted and
                  when the period ends.
                </p>
              </section>

              <p className="text-center text-xs opacity-50">
                <a
                  href="https://mykclawd.xyz/skills#logadog"
                  target="_blank"
                  rel="noreferrer"
                  className="link link-hover"
                >
                  Skill docs on myk clawd
                </a>
              </p>
            </div>
          </article>
        </div>
      </main>
    </>
  );
};

export default BankrSkillPage;

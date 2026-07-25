import { type GetServerSideProps, type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

import { api } from "~/utils/api";
import { getCelebrityPage } from "~/constants/celebrityPages";

// Only slugs defined in the celebrity config resolve — everything else 404s.
// This runs before the page renders so unknown /<slug> paths never mount.
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { celebrity } = context.params as { celebrity: string };
  if (!getCelebrityPage(celebrity)) {
    return { notFound: true };
  }
  return { props: { slug: celebrity.toLowerCase() } };
};

// Eater identity under each dog: avatar + name always; bio (live from
// Farcaster) and description (config) tucked behind a collapsible. If there's
// neither a bio nor a description, there's nothing to expand — show a static
// row instead.
function EaterInfo({
  eater,
}: {
  eater: { name: string; avatarUrl: string; bio: string | null; description: string | null };
}) {
  const canExpand = !!(eater.bio ?? eater.description);
  const header = (
    <span className="flex items-center gap-2">
      {eater.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={eater.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <span className="h-6 w-6 rounded-full bg-base-300" />
      )}
      <span className="text-sm font-medium">{eater.name}</span>
    </span>
  );

  if (!canExpand) {
    return (
      <div className="mt-3 flex items-center border-t-2 border-base-content/10 pt-3">
        {header}
      </div>
    );
  }

  return (
    <details className="group mt-3 border-t-2 border-base-content/10 pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg py-1 hover:bg-base-200">
        {header}
        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide opacity-70">
          <span className="group-open:hidden">{eater.bio ? "read bio" : "read more"}</span>
          <span className="hidden group-open:inline">hide</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-base-content transition group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>
      <div className="mt-2 space-y-2 text-left text-sm">
        {eater.bio && <p className="opacity-80">{eater.bio}</p>}
        {eater.description && <p className="italic opacity-60">{eater.description}</p>}
      </div>
    </details>
  );
}

// Quick "what is this?" explainer for a celebrity who's never heard of Log a Dog.
function WtfModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border-4 border-base-content bg-base-100 p-6 shadow-[6px_6px_0_0_hsl(var(--bc))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl">wtf is Log a Dog?</h2>
        <div className="mt-3 space-y-3 text-sm opacity-80">
          <p>
            Log a Dog is the internet&apos;s summer hotdog-eating sport. People eat hotdogs, log
            them onchain, and get judged by everyone else. It&apos;s already awarded{" "}
            <strong>over $17,000 in prizes</strong> to people for eating hotdogs.
          </p>
          <p>
            Your job: crown the <strong>top dog of the week</strong>. Whichever dog you pick wins
            its eater a <strong>$50 prize</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary btn-sm mt-4 w-full font-display"
        >
          got it
        </button>
      </div>
    </div>
  );
}

const CelebrityPage: NextPage<{ slug: string }> = ({ slug }) => {
  const utils = api.useUtils();
  const { data, isLoading } = api.celebrity.getPage.useQuery({ slug });
  const [selected, setSelected] = useState<string | null>(null);
  const [showWtf, setShowWtf] = useState(false);

  const pickMutation = api.celebrity.pick.useMutation({
    onSuccess: async () => {
      await utils.celebrity.getPage.invalidate({ slug });
    },
  });

  const title = data?.title ?? slug;
  const locked = data?.pick ?? null;
  const submitting = pickMutation.isLoading;
  const selectedName = data?.dogs.find((d) => d.logId === selected)?.name;

  return (
    <>
      <Head>
        <title>{`${title}, pick your favorite dog — Log a Dog`}</title>
        <meta name="description" content={`${title}, pick your favorite dog to win.`} />
        {/* Private guest page — keep it out of search results. */}
        <meta name="robots" content="noindex" />
      </Head>

      <main className="flex flex-col items-center px-4 pt-10 pb-44">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6">
          <h1 className="text-center font-display text-4xl font-black leading-none tracking-tight sm:text-6xl">
            {title}, pick your favorite dog
          </h1>

          {locked ? (
            <p className="text-center font-display text-xl text-success">
              🏆 You picked <span className="underline">{locked.pickedDogName}</span>
            </p>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <p className="text-center font-display text-xl opacity-70">
                The winner you pick wins ${data?.prizeUsd ?? ""}
              </p>
              <button
                type="button"
                onClick={() => setShowWtf(true)}
                className="text-sm underline opacity-60 hover:opacity-100"
              >
                wtf?
              </button>
            </div>
          )}

          {isLoading || !data ? (
            <p className="opacity-60">Loading dogs…</p>
          ) : (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              {data.dogs.map((dog) => {
                const isWinner = locked?.pickedLogId === dog.logId;
                const isSelected = !locked && selected === dog.logId;
                const dimmed = locked && !isWinner;

                const stateClasses = isSelected
                  ? "-translate-y-1 border-[6px] border-yellow-400 ring-4 ring-yellow-300 shadow-[6px_6px_0_0_hsl(var(--bc))]"
                  : isWinner
                    ? "-translate-y-1 border-4 border-success ring-2 ring-success"
                    : "border-4 border-base-content";

                return (
                  <div
                    key={dog.logId}
                    className={[
                      "relative flex flex-col rounded-2xl bg-base-100 p-3 transition",
                      "shadow-[4px_4px_0_0_hsl(var(--bc))]",
                      stateClasses,
                      dimmed ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <span className="absolute -right-3 -top-3 z-10 rotate-6 rounded-full border-4 border-base-content bg-yellow-400 px-3 py-1 font-display text-sm text-black shadow-[3px_3px_0_0_hsl(var(--bc))]">
                        YOUR PICK 👆
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={!!locked || submitting}
                      onClick={() => setSelected(dog.logId)}
                      className={
                        !locked
                          ? "flex w-full flex-col gap-3 cursor-pointer"
                          : "flex w-full flex-col gap-3 cursor-default"
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dog.imageUrl}
                        alt={dog.name}
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-left font-display text-lg">{dog.name}</span>
                        {/* Visual affordance only — the whole card is the tap target.
                            Hidden once selected; the corner sticker signals it instead. */}
                        {!locked && !isSelected && (
                          <span className="shrink-0 rounded-full border-2 border-base-content bg-yellow-400 px-5 py-1.5 font-display text-base uppercase text-black shadow-[2px_2px_0_0_hsl(var(--bc))]">
                            select
                          </span>
                        )}
                        {isWinner && (
                          <span className="shrink-0 font-display text-sm text-success">WINNER</span>
                        )}
                      </div>
                    </button>
                    {dog.eater && <EaterInfo eater={dog.eater} />}
                  </div>
                );
              })}
            </div>
          )}

          <Link href="/" className="mt-2 text-sm underline opacity-60">
            log a dog
          </Link>
        </div>
      </main>

      {/* Sticky confirm: once a dog is tapped, the final-lock action follows the
          celebrity down the page so they never hunt for it. */}
      {!locked && selected && (
        <div className="fixed inset-x-0 bottom-20 z-[60] border-y-4 border-base-content bg-base-100 px-4 py-3 shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.25)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <span className="hidden text-sm opacity-60 sm:block">
              This is final — you can&apos;t change it once you lock it in.
            </span>
            <button
              type="button"
              disabled={submitting}
              onClick={() => pickMutation.mutate({ slug, pickedLogId: selected })}
              className="btn btn-warning btn-lg w-full border-4 border-base-content font-display shadow-[4px_4px_0_0_hsl(var(--bc))] disabled:opacity-50 sm:w-auto"
            >
              {submitting ? "Locking in…" : `Lock in ${selectedName} — final`}
            </button>
          </div>
        </div>
      )}

      {showWtf && <WtfModal onClose={() => setShowWtf(false)} />}
    </>
  );
};

export default CelebrityPage;

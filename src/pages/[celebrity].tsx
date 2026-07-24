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

const CelebrityPage: NextPage<{ slug: string }> = ({ slug }) => {
  const utils = api.useUtils();
  const { data, isLoading } = api.celebrity.getPage.useQuery({ slug });
  const [selected, setSelected] = useState<string | null>(null);

  const pickMutation = api.celebrity.pick.useMutation({
    onSuccess: async () => {
      await utils.celebrity.getPage.invalidate({ slug });
    },
  });

  const title = data?.title ?? slug;
  const locked = data?.pick ?? null;
  const submitting = pickMutation.isLoading;

  return (
    <>
      <Head>
        <title>{`${title}, pick your favorite dog — Log a Dog`}</title>
        <meta name="description" content={`${title}, pick your favorite dog to win.`} />
        {/* Private guest page — keep it out of search results. */}
        <meta name="robots" content="noindex" />
      </Head>

      <main className="flex flex-col items-center px-4 pt-10 pb-16">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6">
          <h1 className="text-center font-display text-3xl tracking-wide sm:text-4xl">
            {title}, pick your favorite dog
          </h1>

          {locked ? (
            <p className="text-center font-display text-xl text-success">
              🏆 You picked <span className="underline">{locked.pickedDogName}</span>
            </p>
          ) : (
            <p className="text-center font-display text-xl opacity-70">
              The winner you pick wins ${data?.prizeUsd ?? ""}
            </p>
          )}

          {isLoading || !data ? (
            <p className="opacity-60">Loading dogs…</p>
          ) : (
            <>
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                {data.dogs.map((dog) => {
                  const isWinner = locked?.pickedLogId === dog.logId;
                  const isSelected = !locked && selected === dog.logId;
                  const dimmed = locked && !isWinner;
                  return (
                    <button
                      key={dog.logId}
                      type="button"
                      disabled={!!locked || submitting}
                      onClick={() => setSelected(dog.logId)}
                      className={[
                        "flex flex-col items-center gap-3 rounded-2xl border-4 border-base-content bg-base-100 p-3 transition",
                        "shadow-[4px_4px_0_0_hsl(var(--bc))]",
                        isSelected
                          ? "-translate-y-1 ring-4 ring-primary shadow-[6px_6px_0_0_hsl(var(--bc))]"
                          : "",
                        isWinner ? "ring-4 ring-success -translate-y-1" : "",
                        dimmed ? "opacity-40" : "",
                        !locked ? "cursor-pointer hover:-translate-y-1" : "cursor-default",
                      ].join(" ")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dog.imageUrl}
                        alt={dog.name}
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      <span className="font-display text-lg">{dog.name}</span>
                      {isWinner && (
                        <span className="font-display text-sm text-success">WINNER</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!locked && (
                <button
                  type="button"
                  disabled={!selected || submitting}
                  onClick={() => selected && pickMutation.mutate({ slug, pickedLogId: selected })}
                  className="btn btn-primary btn-lg font-display shadow-[4px_4px_0_0_hsl(var(--bc))] disabled:opacity-50"
                >
                  {submitting
                    ? "Locking in…"
                    : selected
                      ? `Lock in ${data.dogs.find((d) => d.logId === selected)?.name} — final`
                      : "Tap a dog above"}
                </button>
              )}

              {!locked && (
                <p className="text-center text-sm opacity-50">
                  Your pick is final — you can&apos;t change it once you lock it in.
                </p>
              )}
            </>
          )}

          <Link href="/" className="mt-2 text-sm underline opacity-60">
            log a dog
          </Link>
        </div>
      </main>
    </>
  );
};

export default CelebrityPage;

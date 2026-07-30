// Celebrity "pick your favorite dog" pages.
//
// Each entry defines a page at logadog.xyz/<slug> where a chosen guest picks
// their favorite of 3 dogs to win a cash prize (paid out manually). Adding a
// new celebrity = add an entry here and deploy. The slug must not collide with
// an existing top-level page (faq, earn, admin, dog, profile, judges,
// leaderboard, rules, poidh, bankr-skill, index).
//
// This map is the source of truth the server validates against: the pick
// mutation rejects any slug not defined here and any dog not in that page's
// list, so the public (login-less) endpoint can't be used to write junk or
// spam Telegram.

export interface CelebrityDog {
  /** logId of an existing dog on log-a-dog (its /dog/<logId> page). */
  logId: string;
  /** Display label myk assigns to the dog on the page. */
  name: string;
}

export interface CelebrityPage {
  /** URL slug — logadog.xyz/<slug>. Lowercase. */
  slug: string;
  /** Whose page it is, shown in the heading. */
  title: string;
  /** Prize the celebrity wins for their pick, shown on the page. USD. */
  prizeUsd: number;
  /** Exactly 3 dogs to choose between. */
  dogs: [CelebrityDog, CelebrityDog, CelebrityDog];
}

export const CELEBRITY_PAGES: Record<string, CelebrityPage> = {
  mike: {
    slug: "mike",
    title: "Mike",
    prizeUsd: 50,
    dogs: [
      { logId: "2407", name: "The Candid" },
      { logId: "2406", name: "The Crosseyed" },
      { logId: "2384", name: "The Wink" },
    ],
  },
  bob: {
    slug: "bob",
    title: "Bob",
    prizeUsd: 50,
    dogs: [
      { logId: "2407", name: "The Candid" },
      { logId: "2406", name: "The Crosseyed" },
      { logId: "2384", name: "The Wink" },
    ],
  },
  tony: {
    slug: "tony",
    title: "Tony",
    prizeUsd: 50,
    dogs: [
      { logId: "2354", name: "The Fur Ball" },
      { logId: "2429", name: "The Tortilla Dog" },
      { logId: "2445", name: "The Guac Glizzy" },
    ],
  },
};

export function getCelebrityPage(slug: string): CelebrityPage | null {
  return CELEBRITY_PAGES[slug.toLowerCase()] ?? null;
}
